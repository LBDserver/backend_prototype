const graphStore = require("./graphApi/graphdb");
const docStore = require("./documentApi/mongodb");
const path = require("path");
const fs = require("fs");
const util = require("util");
const { File, Project } = require("./documentApi/mongodb/models");
const errorHandler = require("../util/errorHandler");
const { v4 } = require("uuid");
const { adaptQuery, queryPermissions } = require("../authApi/authorisation/basicPermissions");

//////////////////////////// PROJECT API ///////////////////////////////
// create new project owned by the user
createProject = async (req, res) => {
  try {
    const creator = req.user;
    const { title, description, public } = req.body;
    console.log('description', description)

    if (!title) {
      throw { reason: "Please provide a title for the project", status: 400 };
    }

    const id = v4();

    const metaTitle = `${process.env.DOMAIN_URL}/lbd/${id}.meta`;
    const repoUrl = `${process.env.DOMAIN_URL}/lbd/${id}`;
    // const repoUrl = `${process.env.GRAPHDB_URL}/rest/repositories/${fullTitle}`

    const acl = process.env.DOMAIN_URL + "/lbd/" + id + "/.acl";
    const repoMetaData = graphStore.namedGraphMeta(
      repoUrl,
      acl,
      title,
      description
    );

    // create project repository graphdb
    await graphStore.createRepository(title, id);

    // create its metadata named graph (which refers to acl etc.)
    await graphStore.createNamedGraph(id, {
      context: metaTitle,
      baseURI: metaTitle,
      data: repoMetaData,
    });
     const project = new Project({ url: repoUrl, _id: id })
    creator.projects.push(id);
    await creator.save();
    await project.save(),

    await createDefaultAclGraph(id, creator, acl, public);

    return res.status(201).json({
      metadata: repoMetaData,
      id,
      graphs: [],
      documents: [],
      message: "Project successfully created",
    });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

// helper function to upload the default acls at project initialisation. For now, these are the public and private graphs.
createDefaultAclGraph = (id, creator, aclUrl, public) => {
  return new Promise(async (resolve, reject) => {
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
    acl:agent <${creator.url}>;
    acl:mode acl:Read, acl:Write, acl:Control.

<${creator.url}> vcard:email "${creator.email}".

`;

if (public) {
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
      resolve();
    } catch (error) {
      console.log("error", error);
      reject(error);
    }
  });
};

// send back all projects OWNED by the user (user profile from doc store)
getAllProjects = async (req, res) => {
  try {
    return res.status(200).json({ projects: req.user.projects });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

getPublicProjects = async (req, res) => {
  try {
    const publicProjects = []
    const projects = await Project.find()
    for (const project of projects) {
      console.log('project', project)
      const permissions = await queryPermissions(undefined, `${project.url}/.acl`, project._id)
      if (permissions.has("http://www.w3.org/ns/auth/acl#Read")) {
        const projectData = await findProjectData(project._id)
        publicProjects.push(projectData)
      }
    }
    
    return res.status(200).send({projects: publicProjects})
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({error: reason})
  }
}

// send back project metadata and named graphs.
getOneProject = async (req, res) => {
  try {
    if (req.query.query) {
      console.log("req.query", req.query);
      const results = await queryProject(req);
      return res.status(200).send({ results });
    } else if (req.query.onlyPermissions) {
      return res.status(200).send({ permissions: Array.from(req.permissions) });
    } else {
      const projectName = req.params.projectName;

      const projectData = await findProjectData(projectName)
      projectData.permissions = Array.from(req.permissions)
      return res.status(200).json(projectData);
    }
  } catch (error) {
    return res.status(400).send({ error });
  }
};

findProjectData = async (projectName) => {
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
        graphs[result.contextID.value]= await graphStore.getNamedGraph(
          `${result.contextID.value}.meta`,
          projectName,
          "",
          "turtle"
        );;
      }
    }

    return {
      metadata: projectGraph,
      graphs,
      documents,
      id: projectName
    };
  } catch (error) {
    return error
  }
}

// erase a project from existence
deleteProject = async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const owner = req.user;

    // delete from graph store
    await graphStore.deleteRepository(projectName);
    // delete from list in document store (user)
    let newProjectList = owner.projects.filter((project) => {
      return project !== projectName;
    });
    owner.projects = newProjectList;
    await owner.save();
    const project = await Project.findByIdAndDelete(projectName)
    
    return res
      .status(200)
      .json({ message: `Project ${projectName} was deleted.` });
  } catch (error) {
    const { reason, status } = errorHandler(error);
    return res.status(status).send({ error: reason });
  }
};

//////////////////////////// QUERY API ///////////////////////////////
queryProject = async (req) => {
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
      reject(error);
    }
  });
};

updateNamedGraph = async (req, res) => {
    try {
      console.log('req.query.update', req.query.update)
      const update = encodeURIComponent(req.query.update)
      const projectName = req.params.projectName
      await graphStore.updateRepositorySparql(projectName, update)
      return res.status(204).send({message: "successfully updated the named graph"})

    } catch (error) {
      console.log('error', error)
      return res.status(400).send({message: error});
    }
};

//////////////////////////// document API ///////////////////////////////
uploadDocumentToProject = async (req, res) => {
  try {
    const projectName = req.params.projectName;
    const owner = req.user.url;
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

getDocumentFromProject = async (req, res) => {
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

deleteDocumentFromProject = async (req, res) => {
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
createNamedGraph = async (req, res) => {
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

    const acl = await setAcl(req, context);
    await setGraph(req, projectName, acl, context);

    let label, description;
    if (req.body.description) {
      description = req.body.description;
    }
    if (req.body.label) {
      label = req.body.label;
    }

    metaContext = await setMetaGraph(
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

getFileMeta = async (req, res) => {
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
      if (!graph.length > 0) {
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

getNamedGraph = async (req, res) => {
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
      if (!graph.length > 0) {
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

deleteNamedGraph = async (req, res) => {
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

setAcl = (req, context) => {
  return new Promise(async (resolve, reject) => {
    try {
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
        // customAclMetaData = await graphStore.aclMeta(aclData.context, req.user.url)
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

setGraph = (req, projectName, acl, context) => {
  return new Promise(async (resolve, reject) => {
    try {
      const graphData = {
        context,
        baseURI: context + "#",
        acl,
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

setMetaGraph = (projectName, uri, acl, label, description) => {
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
