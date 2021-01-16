import * as graphStore from './graphApi/graphdb'
import * as docStore from './documentApi/mongodb'
import { File, Project } from './documentApi/mongodb/models'
import { v4 } from "uuid"
import { parse } from "@frogcat/ttl2jsonld"
import { adaptQuery, queryPermissions } from "../authApi/authorisation/basicPermissions"
import undoDatabaseActions from '../util/databaseCleanup'
import {
  IReturnProject,
  IReturnMetadata,
  IQueryResults,
  IReturnGraph,
} from 'lbd-server'

import { IAuthRequest } from '../interfaces/userInterface'

//////////////////////////// PROJECT API ///////////////////////////////
// create new project owned by the user
async function createProject(req): Promise<IReturnProject> {
  const id = v4();
  const metaTitle = `${process.env.DOMAIN_URL}/lbd/${id}.meta`;
  const repoUrl = `${process.env.DOMAIN_URL}/lbd/${id}`;
  const acl = `${process.env.DOMAIN_URL}/lbd/${id}/.acl`

  const { title, description, open } = req.body;
  const creator = req.user;

  if (!creator) {
    throw new Error("You must be authenticated to create a new LBDserver Project")
  }

  const writeCommands = {
    createProjectRepository: { done: false, undoArgs: [id] },
    createProjectDoc: { done: false, undoArgs: [id] },
    saveProjectToUser: { done: false, undoArgs: [id, creator] }
  }

  try {
    const repoMetaData = graphStore.namedGraphMeta(repoUrl, acl, title, description);
    creator.projects.push(id);

    // write everything to the appropriate database
    writeCommands.createProjectRepository.done = await graphStore.createRepository(title, id)
    writeCommands.createProjectDoc.done = await docStore.createProjectDoc(repoUrl, id);
    writeCommands.saveProjectToUser.done = await creator.save();

    // not in writeCommands because automatically removed with project repository
    const metadata = await graphStore.createNamedGraph(id, { context: metaTitle, baseURI: metaTitle, data: repoMetaData });
    await createDefaultAclGraph(id, creator, acl, open);

    const permissions: string[] = Array.from(await queryPermissions(req.user, metadata["lbd:hasAcl"]["@id"], id))

    return ({
      permissions,
      metadata,
      id,
      uri: repoUrl,
      graphs: {},
      documents: {}
    });
  } catch (error) {

    // if some database operation fails, then all the database operations preceding it should be made undone (hence the "writeCommands")
    let undoError = "SUCCESS"
    try {
      await undoDatabaseActions(writeCommands)
    } catch (err) {
      undoError = err.message
    }

    error.message = (`Failed to create Project; ${error.message}. Undoing past operations: ${undoError}`)
    throw error
  }
};

// helper function to upload the default acls at project initialisation. For now, these are the public and private graphs.
async function createDefaultAclGraph(id, creator, aclUrl, open): Promise<string> {
  try {
    let data = `
# Root ACL resource for LBDserver project with id ${id}
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix lbd: <https://lbdserver.org/vocabulary#>.
@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

# The owner has all permissions
<#owner>
    a acl:Authorization;
    acl:agent <${creator.uri}>;
    acl:mode acl:Read, acl:Write, acl:Control.

<${creator.uri}> vcard:email "${creator.email}".

`;

    if (open) {
      data = data + `
  <#visitor>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:mode acl:Read.`
    }
    const aclData = {
      context: aclUrl,
      baseURI: aclUrl + "#",
      data,
    };
    await graphStore.createNamedGraph(id, aclData, "");
    return data;
  } catch (error) {
    error.message = (`Failed creating the default ACL graph; ${error.message}`)
    throw error
  }
};

// send back all projects OWNED by the user (user profile from doc store)
async function getAllProjects(req: IAuthRequest): Promise<IReturnProject[]> {
  const mimeType = req.headers.accept || "application/ld+json"
  const user = req.user

  try {
    const projects = []
    const projectDocuments = await docStore.findAllProjectDocuments()
    for (const project of projectDocuments) {
      if (req.user.projects.includes(project._id)) {
        const permissions: string[] = Array.from(await queryPermissions(req.user, `${project.url}/.acl`, project._id))
        const data = await getProjectData(project._id, user, mimeType)
        data.permissions = permissions
        projects.push(data)
      }
    }
    return (projects);
  } catch (error) {
    error.message = (`Could not retrieve all projects; ${error.message}`)
    throw error
  }
};

async function getPublicProjects(req): Promise<IReturnProject[]> {
  try {
    const mimeType = req.headers.accept || "application/ld+json"
    const user = req.user
    const publicProjects = []
    const projects = await docStore.findAllProjectDocuments()
    for (const project of projects) {
      const permissions: string[] = Array.from(await queryPermissions(undefined, `${project.url}/.acl`, project._id))
      if (permissions.includes("http://www.w3.org/ns/auth/acl#Read")) {
        const projectData =  await getProjectData(project._id, user, mimeType)
        projectData.permissions = permissions
        console.log('projectData', projectData)
        publicProjects.push(projectData)
      }
    }

    return (publicProjects)
  } catch (error) {
    error.message = (`Could not get public projects; ${error.message}`)
    throw error
  }
}

async function getOneProject(req: IAuthRequest) {
  const projectName = req.params.projectName;
  const mimeType = req.headers.accept || "application/ld+json"
  const user = req.user

  try {
    const project = await getProjectData(projectName, user, mimeType)
    project.permissions = req.permissions
    if (req.query.query) {
      const results = await queryProject(req);
      project.results = results
    }

    return project
  } catch (error) {
    
  }
}

async function getProjectData(projectName, user, mimeType): Promise<IReturnProject> {

  try {
    const projectUri = `${process.env.DOMAIN_URL}/lbd/${projectName}`
    const projectGraph = await graphStore.getNamedGraph(
      `${projectUri}.meta`,
      projectName,
      "",
      mimeType
    );

    const permissions: string[]= Array.from(await queryPermissions(user, projectGraph["lbd:hasAcl"]["@id"], projectName))


    const allNamed = await graphStore.getAllNamedGraphs(projectName, "");
    const files = await File.find({
      project: projectUri,
    });
    let documents = {};
    for (const file of files) {
      const data = await graphStore.getNamedGraph(
        `${file.url}.meta`,
        projectName,
        "",
        mimeType
      );
      const permissions = Array.from(await queryPermissions(user, data["lbd:hasAcl"]["@id"], projectName))
      console.log('acl', data["lbd:hasAcl"]["@id"])
      console.log('permissions', permissions)
      if (permissions.length > 0) {
        documents[file.url] = { metadata: data, permissions: Array.from(permissions) }
      }
    }

    let graphs = {};
    for (const result of allNamed.results.bindings) {
      if (
        !result.contextID.value.endsWith("acl") &&
        !result.contextID.value.endsWith("meta")
      ) {
        const data = await graphStore.getNamedGraph(
          `${result.contextID.value}.meta`,
          projectName,
          "",
          mimeType
        );
        
        const permissions = Array.from(await queryPermissions(user, data["lbd:hasAcl"]["@id"], projectName))
        console.log('acl', data["lbd:hasAcl"]["@id"])
        console.log('permissions', permissions)
        if (permissions.length > 0) {
          graphs[result.contextID.value] = { metadata: data, permissions: Array.from(permissions) }
        }
      }
    }

    const project: IReturnProject = {
      permissions,
      metadata: projectGraph,
      graphs,
      documents,
      id: projectName,
      uri: projectUri
    }

    return project;
  } catch (error) {
    error.message = (`Could not find project data for project with id ${projectName}; ${error.message}`)
    throw error
  }
}

// erase a project from existence
async function deleteProject(req): Promise<void> {
  const id = req.params.projectName;
  const repoUrl = `${process.env.DOMAIN_URL}/lbd/${id}`;
  const owner = req.user;

  const writeCommands = {
    deleteProjectDoc: { done: false, undoArgs: [repoUrl, id] },
    deleteProjectFromUser: { done: false, undoArgs: [id, owner] }
  }

  try {
    // delete from list in document store (user)
    let newProjectList = owner.projects.filter((project) => {
      return project !== id;
    });
    owner.projects = newProjectList;

    writeCommands.deleteProjectFromUser = await owner.save();
    writeCommands.deleteProjectDoc.done = await docStore.deleteProjectDoc(id)


    // to do: delete files associated with project

    // delete from graph store (irreversible; so the last item to be removed)
    await graphStore.deleteRepository(id);

    return
  } catch (error) {
    // if some database operation fails, then all the database operations preceding it should be made undone (hence the "writeCommands")
    let undoError = "SUCCESS"
    try {
      await undoDatabaseActions(writeCommands)
    } catch (err) {
      undoError = err.message
    }

    error.message = (`Failed to create Project with id ${id}; ${error.message}. Undoing past operations: ${undoError}`)
    throw error
  }
};

//////////////////////////// QUERY API ///////////////////////////////
async function queryProject(req): Promise<IQueryResults> {
  try {
    if (req.method === "GET") {
      const query = encodeURIComponent(req.query.query);
      if (
        req.query.query.toLowerCase().includes("select") &&
        !query.toLowerCase().includes("insert") &&
        !query.toLowerCase().includes("delete")
      ) {
        const projectName = req.params.projectName;
        const results = await graphStore.queryRepository(projectName, query);
        return (results);
      } else {
        throw new Error("This SPARQL query is not allowed in a GET request. Use POST for INSERT and DELETE queries")

      };
    }
  } catch (error) {
    error.message = (`Could not complete query; ${error.message}`)
    throw error
  }
};

async function updateProject(req): Promise<void> {
  try {
    console.log('req.query.update', req.query.update)
    const update = encodeURIComponent(req.query.update)
    const projectName = req.params.projectName
    await graphStore.updateRepositorySparql(projectName, update)
    return
  } catch (error) {
    error.message = (`Could not update named graph; ${error.message}`)
    throw error
  }
};

//////////////////////////// document API ///////////////////////////////
async function uploadDocumentToProject(req): Promise<IReturnMetadata> {
  try {
    const projectName = req.params.projectName;
    const owner = req.user.uri;
    console.log('req.files', req.files)
    const data = req.files.resource[0].buffer;
    console.log('data', data)
    // upload document
    const documentUrl = await docStore.uploadDocument(
      projectName,
      data,
      owner
    );


    let label, description;
    if (req.body.description) {
      description = req.body.description;
    }
    if (req.body.label) {
      label = req.body.label;
    }

    // upload document metadata to the graph store
    const acl = await setAcl(req);
    const metadata = await setMetaGraph(projectName, documentUrl, acl, label, description);
    const permissions: string[] = Array.from(await queryPermissions(req.user, metadata["lbd:hasAcl"]["@id"], projectName))

    return { uri: documentUrl, metadata, permissions };
  } catch (error) {
    error.message = (`Error uploading file; ${error.message}`)
    throw error
  }
};

async function getDocumentFromProject(req): Promise<Buffer> {
  const projectName = req.params.projectName;
  const fileId = req.params.fileId;
  const uri = `${process.env.DOMAIN_URL}${req.originalUrl}`;
  const mimeType = req.headers.accept || "application/ld+json"
  try {
    const data = await docStore.getDocument(projectName, fileId);
    const metadata = await graphStore.getNamedGraph(`${uri}.meta`, projectName, "", mimeType)
    return data.main.buffer
  } catch (error) {
    error.message = (`Unable to get document with uri ${uri}; ${error.message}`)
    throw error
  }
};

async function getDocumentMetadata(req): Promise<IReturnMetadata> {
  const projectName = req.params.projectName;
  const uri = `${process.env.DOMAIN_URL}${req.originalUrl}`;
  const mimeType = req.headers.accept || "application/ld+json"
  try {
    const metadata = await graphStore.getNamedGraph(`${uri}`, projectName, "", mimeType)
    const permissions: string[] = Array.from(await queryPermissions(req.user, metadata["lbd:hasAcl"]["@id"], projectName))
    return { uri, metadata, permissions };
  } catch (error) {
    error.message = (`Unable to get document with uri ${uri}; ${error.message}`)
    throw error
  }
};


async function deleteDocumentFromProject(req): Promise<void> {
  try {
    const docUrl = await docStore.deleteDocument(req.params.fileId);
    const projectName = req.params.projectName;
    await graphStore.deleteNamedGraph(docUrl + ".meta", projectName, "");

    return
  } catch (error) {
    error.message = (`Unable to delete document; ${error.message}`)
    throw error
  }
};

//////////////////////////// NAMED GRAPHS API ///////////////////////////////
async function createNamedGraph(req): Promise<IReturnMetadata> {
  try {
    const projectName = req.params.projectName;
    const id = v4()
    const uri = process.env.DOMAIN_URL + "/lbd/" + projectName + "/graphs/" + id;

    const acl = await setAcl(req);
    await setGraph(req, projectName, acl, uri);

    let label, description;
    if (req.body.description) {
      description = req.body.description;
    }
    if (req.body.label) {
      label = req.body.label;
    }

    const metadata = await setMetaGraph(
      projectName,
      uri,
      acl,
      label,
      description
    );

    const permissions: string[] = Array.from(await queryPermissions(req.user, acl, projectName))

    return { uri, metadata, permissions };
  } catch (error) {
    error.message = (`Unable to create named graph; ${error.message}`)
    throw error
  }
};

// async function getFileMeta(req) {
//   try {
//     const projectName = req.params.projectName;
//     const fileId = req.params.fileId;
//     const mimeType = req.headers.accept || "application/ld+json"
//     const namedGraph =
//       process.env.DOMAIN_URL + "/lbd/" + projectName + "/files/" + fileId;

//     if (req.query.query) {
//       const newQuery = await adaptQuery(req.query.query, [namedGraph]);
//       const results = await graphStore.queryRepository(projectName, newQuery);

//       return { query: newQuery, results };
//     } else {
//       const graph = await graphStore.getNamedGraph(namedGraph, projectName, "", mimeType);
//       if (!(graph.length > 0)) {
//         throw new Error('Graph not found')
//       }
//       return { graph };
//     }
//   } catch (error) {
//     error.message = (`Error finding metadata; ${error.message}`)
//     throw error
//   }
// };

async function getNamedGraph(req): Promise<IReturnGraph> {
  const projectName = req.params.projectName;
  const graphId = req.params.graphId;
  const namedGraph = process.env.DOMAIN_URL + "/lbd/" + projectName + "/graphs/" + graphId;
  const mimeType = req.headers.accept || 'application/ld+json'
  let permissions: string[]
  try {
    if (req.query.query) {
      const newQuery = await adaptQuery(req.query.query, [namedGraph]);
      const results = await graphStore.queryRepository(projectName, newQuery);
      return { uri: namedGraph, results }
    } else {
      console.log("getting graph", namedGraph, projectName)
      // get the metadata graph
      const data = await graphStore.getNamedGraph(namedGraph, projectName, "", mimeType);
      permissions = Array.from(await queryPermissions(req.user, data["lbd:hasAcl"]["@id"], projectName))

      if (!graphId.endsWith('.meta')) {
        const metadata = await graphStore.getNamedGraph(`${namedGraph}.meta`, projectName, "", mimeType);
        permissions = Array.from(await queryPermissions(req.user, metadata["lbd:hasAcl"]["@id"], projectName))
        return { uri: namedGraph, data, metadata, permissions }
      } else {
        return { uri: namedGraph, data, permissions }
      }

    }
  } catch (error) {
    error.message = (`Could not get graph ${namedGraph}; ${error.message}`)
    throw error
  }
};


async function deleteNamedGraph(req, res): Promise<void> {
  const projectName = req.params.projectName;
  const graphId = req.params.graphId;
  const namedGraph = `${process.env.DOMAIN_URL}/lbd/${projectName}/graphs/${graphId}`
  const namedGraphMeta = `${process.env.DOMAIN_URL}/lbd/${projectName}/graphs/${graphId}.meta`

  try {
    await graphStore.deleteNamedGraph(namedGraph, projectName, "");
    await graphStore.deleteNamedGraph(namedGraphMeta, projectName, "");

    return
  } catch (error) {
    error.message = (`Unable to delete graph ${namedGraph}; ${error.message}`)
    throw error
  }
};

///// HELPER FUNCTIONS ////////
async function setAcl(req): Promise<string> {
  try {
    let acl, customAcl
    const projectName = req.params.projectName;
    const mimeType = req.headers.accept || "application/ld+json"
    // default: if not specified, the main project acl is chosen
    if (!req.body.acl && !req.files.acl) {
      acl = `https://lbdserver.org/lbd/${projectName}/.acl`;

      // an acl graph is sent with the upload, as well as a context for the acl
    } else if (req.files.acl) {
      console.log("custom acl detected");

      if (!req.body.aclName) {
        throw new Error(
          "When uploading a custom acl file, please set a context URL for it"
        );
      }

      // create named graph in the project repository from acl file, set acl here to its url
      const aclData = {
        context: req.body.aclName,
        baseURI: req.body.aclName + "#",
        data: req.files.acl[0].buffer.toString(),
      };

      customAcl = await graphStore.createNamedGraph(projectName, aclData, "");
      acl = aclData.context;
    } else {
      try {
        await graphStore.getNamedGraph(req.body.acl, projectName, "", mimeType);
        acl = req.body.acl;
      } catch (error) {
        throw new Error("The specified acl graph does not exist yet. Please consider uploading a custom acl file or refer to already existing acl files");
      }
    }
    return acl
  } catch (error) {
    error.message = (`Could not create ACL file; ${error.message}`)
    throw error
  }
};

async function setGraph(req, projectName, acl, context): Promise<void> {
  try {
    const graphData = {
      context,
      baseURI: context + "#",
      acl,
      data: undefined
    };

    // an existing graph is sent along
    if (req.files.resource) {
      graphData.data = req.files.resource[0].buffer.toString()
    } else { // a blank graph is to be created
      graphData.data = `
@prefix : <${context}#>.
@prefix sp: <http://spinrdf.org/sp#>.
@prefix bot: <https://w3id.org/bot#>.
@prefix stg: <https://raw.githubusercontent.com/JWerbrouck/Thesis/master/stg.ttl#>.

: a sp:NamedGraph .
        `
    }

    await graphStore.createNamedGraph(projectName, graphData, "");
    console.log("created graph with context", graphData.context);
    return;

  } catch (error) {
    error.message = (`Could not create graph with context ${context}; ${error.message}`)
    throw error
  }
};

async function setMetaGraph(projectName, uri, acl, label, description): Promise<string> {
  try {
    let graphMetaData;
    graphMetaData = await graphStore.namedGraphMeta(
      uri,
      acl,
      label,
      description
    );

    const graphMeta = {
      context: uri + ".meta",
      baseURI: uri + ".meta#",
      data: graphMetaData,
      label,
      description,
    };

    await graphStore.createNamedGraph(projectName, graphMeta, "");

    return parse(graphMetaData);
  } catch (error) {
    error.message = (`Could not create metadata graph with context ${uri}; ${error.message}`)
    throw error
  }
};

export {
  getAllProjects,
  createProject,
  getOneProject,
  deleteProject,
  queryProject,

  getDocumentFromProject,
  uploadDocumentToProject,
  deleteDocumentFromProject,

  updateProject,
  getNamedGraph,
  createNamedGraph,
  deleteNamedGraph,
  getDocumentMetadata,
  getPublicProjects
};
