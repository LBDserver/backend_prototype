const graphStore = require('./graphApi/graphdb')
const docStore = require('./documentApi/mongodb')
const path = require('path');
const fs = require('fs');
const util = require("util");
const { File } = require('./documentApi/mongodb/models')
const errorHandler = require('../util/errorHandler')


//////////////////////////// PROJECT API ///////////////////////////////
// create new project owned by the user
createProject = async (req, res) => {
    try {
        const owner = req.user
        const { title, description, acl } = req.body

        if (!title) {
            throw { reason: "Please provide a title for the project", status: 400 }
        }

        const fullTitle = `${owner.username}-${title}`
        const LBD_url = `${process.env.SERVER_URL}/project/${fullTitle}`

        if (owner.projects.some(item => item.LBD_url === LBD_url)) {
            throw { reason: "Project already exists", status: 409 }
        }

        const metaTitle = `${process.env.SERVER_URL}/project/${fullTitle}.meta`
        const repoUrl = `${process.env.SERVER_URL}/project/${fullTitle}`
        // const repoUrl = `${process.env.GRAPHDB_URL}/rest/repositories/${fullTitle}`

        const repoMetaData = graphStore.namedGraphMeta(repoUrl, acl, owner.url, fullTitle, description)
        // create project repository graphdb
        await graphStore.createRepository(fullTitle, fullTitle)
        // create its metadata named graph (which refers to acl etc.)
        await graphStore.createNamedGraph(fullTitle, { name: repoUrl, context: metaTitle, baseURI: metaTitle, data: repoMetaData })
        // save the project to the projects field of the owner (mongo)
        owner.projects.push({ Graph_url: repoUrl, LBD_url })
        await owner.save()

        await createDefaultAclGraphs(fullTitle)

        return res.status(201).json({ message: "Project repository and metadata graph created", url: repoUrl })

    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

// helper function to upload the default acls at project initialisation. For now, these are the public and private graphs.
createDefaultAclGraphs = (fullTitle) => {
    return new Promise(async (resolve, reject) => {
        try {
            const directoryPath = path.join(process.cwd(), 'misc/acl_templates');
            const readdir = util.promisify(fs.readdir)
            const aclFiles = await readdir(directoryPath)
            aclFiles.forEach(async function (file) {
                const readFile = util.promisify(fs.readFile)
                const data = await readFile(directoryPath + '/' + file, 'utf-8')
                const aclData = {
                    context: 'https://lbdserver.com/acl/' + file,
                    baseURI: 'https://lbdserver.com/acl/' + file + '#',
                    data
                }
                await graphStore.createNamedGraph(fullTitle, aclData, '')
                resolve()
            });
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// send back all projects OWNED by the user (user profile from doc store)
getAllProjects = async (req, res) => {
    try {
        return res.status(200).json({ projects: req.user.projects })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

// send back project metadata and named graphs.
getOneProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user
        const projectGraph = await graphStore.getNamedGraph(`${process.env.SERVER_URL}/project/${projectName}.meta`, projectName, '', 'turtle')
        const allNamed = await graphStore.getAllNamedGraphs(projectName, '')
        const files = await File.find({ project: `${process.env.SERVER_URL}/project/${projectName}` })
        let documentUrls = []
        files.forEach(file => {
            documentUrls.push(file.url)
        })

        let namedUris = []
        allNamed.results.bindings.forEach(result => {
            if (!result.contextID.value.endsWith('acl') && !result.contextID.value.endsWith('meta')) {
                namedUris.push(result.contextID.value)
            }
        })

        return res.status(200).json({ projectGraph, graphs: namedUris, documents: documentUrls })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

// erase a project from existence
deleteProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user

        // delete from graph store
        await graphStore.deleteRepository(projectName)
        // delete from list in document store (user)
        let newProjectList = owner.projects.filter(project => {
            return project.Graph_url !== `${process.env.SERVER_URL}/project/${projectName}`
        })
        owner.projects = newProjectList
        await owner.save()

        return res.status(200).json({ message: `Project ${projectName} was deleted.` })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

//////////////////////////// QUERY API ///////////////////////////////
queryProject = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const query = encodeURIComponent(req.query.query)
            if (req.query.query.toLowerCase().includes('select') && !query.toLowerCase().includes('insert') && !query.toLowerCase().includes('delete')) {
                const projectName = req.params.projectName
                const results = await graphStore.queryRepository(projectName, query)
                return res.status(200).send({ results })
            } else {
                throw {reason: 'This SPARQL query is not allowed in a GET request. Use POST for INSERT and DELETE queries', status: 400}
            }
        } else if (req.method === 'POST') {
            const update = encodeURIComponent(req.query.update)
            const projectName = req.params.projectName
            await graphStore.updateRepositorySparql(projectName, update)
            return res.status(204).send()
        }
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

//////////////////////////// document API ///////////////////////////////
uploadDocumentToProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user.url
        const data = req.files.file[0].buffer

        // upload document
        const documentUrl = await docStore.uploadDocuments(projectName, data, owner)

        // upload document metadata to the graph store
        const acl = await setAcl(req)

        let label, description
        if (req.body.description) {
            description = req.body.description
        }
        if (req.body.label) {
            label = req.body.label
        }

        await setMetaGraph(projectName, documentUrl, acl, owner, label, description)

        return res.status(201).json({ url: documentUrl })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

getDocumentFromProject = async (req, res) => {
    try {
        // only access docdb
        const projectName = req.params.projectName
        const fileId = req.params.fileId
        const owner = req.user.url
        const file = await docStore.getDocument(projectName, fileId)

        return res.status(200).json({ file })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

deleteDocumentFromProject = async (req, res) => {
    try {
        const docUrl = await docStore.deleteDocument(req.params.fileId)
        const projectName = req.params.projectName
        await graphStore.deleteNamedGraph(docUrl + '.meta', projectName, '')

        return res.status(200).send({ message: 'Document deleted' })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

//////////////////////////// NAMED GRAPHS API ///////////////////////////////
getNamedGraph = async (req, res) => {
    try {
        const projectId = req.params.projectName
        const namedGraph = req.query.graph

        const graph = await graphStore.getNamedGraph(namedGraph, projectId, '', 'turtle')
        if (!graph.length > 0) {
            throw { reason: "Graph not found", status: 404 }
        }
        return res.json({ graph })
    } catch (error) {
        if (error.reason) {
            return res.status(error.status).send({ error: error.reason })
        } else {
            return res.status(500).send({ error: error.message })
        }
    }
}

deleteNamedGraph = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const namedGraph = req.query.graph

        const allNamed = await graphStore.getAllNamedGraphs(projectName, '')
        let graphsToDelete = []
        allNamed.results.bindings.forEach(result => {
            if (result.contextID.value.startsWith(namedGraph)) {
                graphsToDelete.push(result.contextID.value)
            }
        })

        if (!graphsToDelete.length > 0) {
            throw { reason: "Graph not found", status: 404 }
        }

        for await (graph of graphsToDelete) {
            graphStore.deleteNamedGraph(graph, projectName, '')
        }

        return res.status(200).json({ message: 'The named graph was successfully deleted' })

    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

createNamedGraph = async (req, res) => {
    try {
        const projectName = req.params.projectName

        // check if there is no such named graph yet
        const graphName = req.body.context
        let presentGraphs = []
        const allNamed = await graphStore.getAllNamedGraphs(projectName, '')
        allNamed.results.bindings.forEach(result => {
            presentGraphs.push(result.contextID.value)
        })

        if (presentGraphs.includes(graphName)) {
            throw { reason: 'A named graph with this context already exists', status: 409 }
        }

        const acl = await setAcl(req)
        context = await setGraph(req, projectName, acl)

        let label, description
        if (req.body.description) {
            description = req.body.description
        }
        if (req.body.label) {
            label = req.body.label
        }

        metaContext = await setMetaGraph(projectName, context, acl, req.user.url, label, description)

        return res.status(201).json({ message: `Successfully created the named graph with context ${context}` })
    } catch (error) {
        const { reason, status } = errorHandler(error)
        return res.status(status).send({ error: reason })
    }
}

setAcl = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const projectName = req.params.projectName
            // default: if not specified, only the owner has access
            if (!req.body.acl && !req.files.acl) {
                acl = 'https://lbdserver.com/acl/private.acl'

            } else if (req.files.acl) {
                console.log('custom acl detected')
                // create named graph in the project repository from acl file, set acl here to its url
                const aclData = {
                    context: req.body.context + '.acl',
                    baseURI: req.body.context + '.acl#',
                    data: req.files.acl[0].buffer.toString()
                }

                customAcl = await graphStore.createNamedGraph(projectName, aclData, '')
                customAclMetaData = await graphStore.aclMeta(aclData.context, req.user.url)
                const aclMeta = {
                    context: req.body.context + '.acl.meta',
                    baseURI: req.body.context + '.acl.meta#',
                    data: customAclMetaData
                }

                await graphStore.createNamedGraph(projectName, aclMeta, '')
                acl = aclData.context
            }
            else if (req.body.acl === 'private' || req.body.acl === 'https://lbdserver.com/acl/private') {
                acl = 'https://lbdserver.com/acl/private.acl'
            } else if (req.body.acl === 'public' || req.body.acl === 'https://lbdserver.com/acl/public') {
                acl = 'https://lbdserver.com/acl/public.acl'
            }

            resolve(acl)

        } catch (error) {
            reject(error)
        }
    })
}

setGraph = (req, projectName, acl) => {
    return new Promise(async (resolve, reject) => {
        try {
            const graphData = {
                context: req.body.context,
                baseURI: req.body.context + '#',
                data: req.files.graph[0].buffer.toString(),
                acl
            }

            await graphStore.createNamedGraph(projectName, graphData, '')
            console.log('created graph with context', graphData.context)

            resolve(graphData.context)
        } catch (error) {
            reject(error)
        }
    })
}

setMetaGraph = (projectName, uri, acl, user, label, description) => {
    return new Promise(async (resolve, reject) => {
        try {
            const graphMetaData = await graphStore.namedGraphMeta(uri, acl, user, label, description)
            const graphMeta = {
                context: uri + '.meta',
                baseURI: uri + '.meta#',
                data: graphMetaData,
                label,
                description
            }

            await graphStore.createNamedGraph(projectName, graphMeta, '')
            console.log('created metadata graph with context', graphMeta.context)
            resolve(graphMeta.context)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    deleteProject,
    queryProject,

    getDocumentFromProject,
    uploadDocumentToProject,
    deleteDocumentFromProject,

    getNamedGraph,
    createNamedGraph,
    deleteNamedGraph
}
