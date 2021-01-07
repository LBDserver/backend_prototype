import * as graphStore from './graphApi/graphdb'
import * as docStore from './documentApi/mongodb'
import { File, Project } from './documentApi/mongodb/models'
import * as errorHandler from '../util/errorHandler'
import { v4 } from "uuid"
import { adaptQuery, queryPermissions } from "../authApi/authorisation/basicPermissions"
import { IReturnProject } from '../interfaces/projectInterface'
import undoDatabaseActions from '../util/databaseCleanup'

//////////////////////////// PROJECT API ///////////////////////////////
// create new project owned by the user
async function createProject(req) {
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
    await graphStore.createNamedGraph(id, { context: metaTitle, baseURI: metaTitle, data: repoMetaData });
    await createDefaultAclGraph(id, creator, acl, open);

    return ({
      metadata: repoMetaData,
      id,
      graphs: {},
      documents: {},
      message: "Project successfully created",
    });
  } catch (error) {

    // if some database operation fails, then all the database operations preceding it should be made undone (hence the "writeCommands")
    let undoError = "SUCCESS"
    try {
      await undoDatabaseActions(writeCommands)
    } catch (err) {
      undoError = err.message
    }

    throw new Error(`Failed to create Project; ${error.message}. Undoing past operations: ${undoError}`)
  }
};

// helper function to upload the default acls at project initialisation. For now, these are the public and private graphs.
async function createDefaultAclGraph(id, creator, aclUrl, open) {
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
    return true;
  } catch (error) {
    throw new Error(`Failed creating the default ACL graph; ${error.message}`)
  }
};

// send back all projects OWNED by the user (user profile from doc store)
function getAllProjects(req) {
  return new Promise<IReturnProject[]>(async (resolve, reject) => {
    try {
      const projects = []
      for (const project of req.user.projects) {
        const data = await findProjectData(project)
        projects.push(data)
      }
      return resolve(projects);
    } catch (error) {
      console.error(error)
      reject(error);
    }
  })
};

function getPublicProjects() {
  return new Promise<IReturnProject[]>(async (resolve, reject) => {
    try {
      const publicProjects = []
      const projects = await docStore.findAllProjectDocuments()
      for (const project of projects) {
        const permissions = await queryPermissions(undefined, `${project.url}/.acl`, project._id)
        if (permissions.has("http://www.w3.org/ns/auth/acl#Read")) {
          const projectData = await findProjectData(project._id)
          publicProjects.push(projectData)
        }
      }

      resolve(publicProjects)
    } catch (error) {
      reject(error)
    }
  })
}

// send back project metadata and named graphs.
function getOneProject(req) {
  // if (req.query.query) {
  //   return new Promise(async(resolve, reject) => {
  //     try {
  //       const results = await queryProject(req);
  //       resolve({results})
  //     } catch (error) {
  //       reject(error)
  //     }
  //   })
  // } else if (req.query.onlyPermissions) {
  //   return new Promise(async(resolve, reject) => {
  //     try {
  //       resolve({ permissions: Array.from(req.permissions) });
  //     } catch (error) {
  //       reject(error)
  //     }
  //   })
  // } else {
  //   return new Promise(async(resolve, reject) => {
  //     try {

  //     } catch (error) {
  //       reject(error)
  //     }
  //   })
  // }
  // return new Promise<IReturnProject>(async (resolve, reject) => {
  //   try {
  //     if (req.query.query) {
  //       console.log("req.query", req.query);
  //       const results = await queryProject(req);
  //       resolve({results})
  //     } else if (req.query.onlyPermissions) {
  //       resolve({ permissions: Array.from(req.permissions) });
  //     } else {
  //       const projectName = req.params.projectName;

  //       const projectData = await findProjectData(projectName)
  //       projectData.permissions = Array.from(req.permissions)
  //       resolve(projectData);
  //     }
  //   } catch (error) {
  //     reject(error)
  //   }
  // })
};

function findProjectData(projectName) {
  return new Promise<IReturnProject>(async (resolve, reject) => {
    try {
      const projectGraph = await graphStore.getNamedGraph(
        `${process.env.DOMAIN_URL}/lbd/${projectName}.meta`,
        projectName,
        "",
        "turtle"
      );
      const allNamed = await graphStore.getAllNamedGraphs(projectName, "");
      const files = await File.find({
        project: `${process.env.DOMAIN_URL}/lbd/${projectName}`,
      });
      let documents = {};
      for (const file of files) {
        documents[file.url] = await graphStore.getNamedGraph(
          `${file.url}.meta`,
          projectName,
          "",
          "turtle"
        );
      }

      let graphs = {};
      for (const result of allNamed.results.bindings) {
        if (
          !result.contextID.value.endsWith("acl") &&
          !result.contextID.value.endsWith("meta")
        ) {
          graphs[result.contextID.value] = await graphStore.getNamedGraph(
            `${result.contextID.value}.meta`,
            projectName,
            "",
            "turtle"
          );;
        }
      }

      resolve({
        metadata: projectGraph,
        graphs,
        documents,
        id: projectName
      });
    } catch (error) {
      reject(error)
    }
  })
}

// erase a project from existence
async function deleteProject(req) {
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

    throw new Error(`Failed to create Project with id ${id}; ${error.message}. Undoing past operations: ${undoError}`)
  }
};

//////////////////////////// QUERY API ///////////////////////////////
function queryProject(req) {
  return new Promise(async (resolve, reject) => {
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
          resolve(results);
        } else {
          throw {
            reason:
              "This SPARQL query is not allowed in a GET request. Use POST for INSERT and DELETE queries",
            status: 400,
          };
        }
      }
      //  else if (req.method === 'POST') {
      //     const update = encodeURIComponent(req.query.update)
      //     const projectName = req.params.projectName
      //     await graphStore.updateRepositorySparql(projectName, update)
      //     return res.status(204).send()
      // }
    } catch (error) {
      console.error('error', error)
      reject(error);
    }
  });
};

function updateNamedGraph(req) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log('req.query.update', req.query.update)
      const update = encodeURIComponent(req.query.update)
      const projectName = req.params.projectName
      await graphStore.updateRepositorySparql(projectName, update)
      resolve()
    } catch (error) {
      console.error('error', error)
      reject(error)
    }
  })
};

//////////////////////////// document API ///////////////////////////////
async function uploadDocumentToProject(req, res) {
  try {
    const projectName = req.params.projectName;
    const owner = req.user.uri;
    const data = req.files.file[0].buffer;

    // upload document
    const documentUrl = await docStore.uploadDocuments(
      projectName,
      data,
      owner
    );

    // upload document metadata to the graph store
    const acl = await setAcl(req);

    let label, description;
    if (req.body.description) {
      description = req.body.description;
    }
    if (req.body.label) {
      label = req.body.label;
    }

    const metaContext = await setMetaGraph(projectName, documentUrl, acl, label, description);

    return res.status(201).json({ url: documentUrl, metaGraph: metaContext });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

async function getDocumentFromProject(req, res) {
  try {
    // only access docdb
    const projectName = req.params.projectName;
    const fileId = req.params.fileId;
    const url = `${process.env.DOMAIN_URL}${req.originalUrl}`;
    if (req.query.onlyPermissions) {
      return res.status(200).send({ permissions: Array.from(req.permissions) });
    } else if (!url.endsWith(".meta")) {
      const file = await docStore.getDocument(projectName, fileId);

      return res.status(200).send(file.main);
    } else {
      const results = await getFileMeta(req, res);
      return res.status(200).json({ ...results, permissions: Array.from(req.permissions) });
    }
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

async function deleteDocumentFromProject(req, res) {
  try {
    const docUrl = await docStore.deleteDocument(req.params.fileId);
    const projectName = req.params.projectName;
    await graphStore.deleteNamedGraph(docUrl + ".meta", projectName, "");

    return res.status(200).send({ message: "Document deleted" });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

//////////////////////////// NAMED GRAPHS API ///////////////////////////////
async function createNamedGraph(req, res) {
  try {
    const projectName = req.params.projectName;

    // check if there is no such named graph yet
    const context =
      process.env.DOMAIN_URL + "/lbd/" + projectName + "/graphs/" + v4();
    let presentGraphs = [];
    const allNamed = await graphStore.getAllNamedGraphs(projectName, "");
    allNamed.results.bindings.forEach((result) => {
      presentGraphs.push(result.contextID.value);
    });

    const acl = await setAcl(req);
    await setGraph(req, projectName, acl, context);

    let label, description;
    if (req.body.description) {
      description = req.body.description;
    }
    if (req.body.label) {
      label = req.body.label;
    }

    const metaContext = await setMetaGraph(
      projectName,
      context,
      acl,
      label,
      description
    );

    return res.status(201).json({
      message: `Successfully created the named graph with context ${context}`,
      metaGraph: metaContext,
      url: context
    });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

async function getFileMeta(req, res) {
  try {
    const projectName = req.params.projectName;
    const fileId = req.params.fileId;

    const namedGraph =
      process.env.DOMAIN_URL + "/lbd/" + projectName + "/files/" + fileId;

    if (req.query.query) {
      console.log("req.query.query", req.query.query);
      const newQuery = await adaptQuery(req.query.query, [namedGraph]);
      console.log("newQuery", newQuery);
      const results = await graphStore.queryRepository(projectName, newQuery);

      return { query: newQuery, results };
    } else {
      console.log("namedGraph", namedGraph);
      const graph = await graphStore.getNamedGraph(
        namedGraph,
        projectName,
        "",
        "turtle"
      );
      console.log("graph", graph);
      if (!(graph.length > 0)) {
        throw { reason: "Graph not found", status: 404 };
      }
      return { graph };
    }
  } catch (error) {
    if (error.reason) {
      return res.status(error.status).send({ error: error.reason });
    } else {
      return res.status(500).send({ error: error.message });
    }
  }
};

async function getNamedGraph(req, res) {
  try {
    const projectName = req.params.projectName;
    const graphId = req.params.graphId;

    const namedGraph =
      process.env.DOMAIN_URL + "/lbd/" + projectName + "/graphs/" + graphId;

    if (req.query.onlyPermissions) {
      return res.status(200).send({ permissions: Array.from(req.permissions) });

    } else if (req.query.query) {
      console.log("req.query.query", req.query.query);
      const newQuery = await adaptQuery(req.query.query, [namedGraph]);
      console.log("newQuery", newQuery);
      const results = await graphStore.queryRepository(projectName, newQuery);

      return res.status(200).json({ query: newQuery, results });
    } else {
      const graph = await graphStore.getNamedGraph(
        namedGraph,
        projectName,
        "",
        "turtle"
      );
      if (!(graph.length > 0)) {
        throw { reason: "Graph not found", status: 404 };
      }
      return res.json({ graph, permissions: Array.from(req.permissions) });
    }
  } catch (error) {
    if (error.reason) {
      return res.status(error.status).send({ error: error.reason });
    } else {
      return res.status(500).send({ error: error.message });
    }
  }
};

async function deleteNamedGraph(req, res) {
  try {
    const projectName = req.params.projectName;
    const graphId = req.params.graphId;

    const namedGraph =
      process.env.DOMAIN_URL + "/lbd/" + projectName + "/graphs/" + graphId;
    const namedGraphMeta =
      process.env.DOMAIN_URL +
      "/lbd/" +
      projectName +
      "/graphs/" +
      graphId +
      ".meta";
    await graphStore.deleteNamedGraph(namedGraph, projectName, "");

    await graphStore.deleteNamedGraph(namedGraphMeta, projectName, "");

    return res
      .status(200)
      .json({ message: "The named graph was successfully deleted" });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

function setAcl(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let acl, customAcl
      const projectName = req.params.projectName;

      // default: if not specified, the main project acl is chosen
      if (!req.body.acl && !req.files.acl) {
        acl = `https://lbdserver.org/lbd/${projectName}/.acl`;

        // an acl graph is sent with the upload, as well as a context for the acl
      } else if (req.files.acl) {
        console.log("custom acl detected");

        if (!req.files.aclName) {
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
        // customAclMetaData = await graphStore.aclMeta(aclData.context, req.user.uri)
        // const aclMeta = {
        //     context: req.body.context + '.acl.meta',
        //     baseURI: req.body.context + '.acl.meta#',
        //     data: customAclMetaData
        // }

        // await graphStore.createNamedGraph(projectName, aclMeta, '')
        acl = aclData.context;
        // }
        // else if (req.body.acl === 'private' || req.body.acl === 'https://lbdserver.org/acl/private.acl') {
        //     acl = 'https://lbdserver.org/acl/private.acl'
        // } else if (req.body.acl === 'public' || req.body.acl === 'https://lbdserver.org/acl/public.acl') {
        //     acl = 'https://lbdserver.org/acl/public.acl'
        // } else if (req.body.context.endsWith('.acl')) {
        //     acl = req.body.context

        // the acl referred to in req.body.acl is set (if it exists)
      } else {
        try {
          await graphStore.getNamedGraph(
            req.body.acl,
            projectName,
            "",
            "turtle"
          );
          acl = req.body.acl;
        } catch (error) {
          throw {
            reason:
              "The specified acl graph does not exist yet. Please consider uploading a custom acl file or refer to already existing acl files",
            status: 400,
          };
        }
      }

      resolve(acl);
    } catch (error) {
      reject(error);
    }
  });
};

function setGraph(req, projectName, acl, context) {
  return new Promise(async (resolve, reject) => {
    try {
      const graphData = {
        context,
        baseURI: context + "#",
        acl,
        data: undefined
      };

      // an existing graph is sent along
      if (req.files.graph) {
        graphData.data = req.files.graph[0].buffer.toString()
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

      resolve(graphData.context);
    } catch (error) {
      reject(error);
    }
  });
};

function setMetaGraph(projectName, uri, acl, label, description) {
  return new Promise(async (resolve, reject) => {
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
      console.log("created metadata graph with context", graphMeta.context);
      resolve(graphMetaData);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getAllProjects,
  createProject,
  getOneProject,
  deleteProject,
  queryProject,

  getDocumentFromProject,
  uploadDocumentToProject,
  deleteDocumentFromProject,

  updateNamedGraph,
  getNamedGraph,
  createNamedGraph,
  deleteNamedGraph,

  getPublicProjects
};
