const graphStore = require('./graphApi/graphdb')
const docStore = require('./documentApi/mongodb')
const path = require('path');
const fs = require('fs');
const util = require("util");

//////////////////////////// PROJECT API ///////////////////////////////
// create new project owned by the user
createProject = async (req, res) => {
    try {
        const owner = req.user
        const { title, description, acl } = req.body
        const fullTitle = `${owner.username}-${title}`
        const LBD_url = `${process.env.SERVER_URL}/project/${fullTitle}`
        if (owner.projects.some(item => item.LBD_url === LBD_url)) {
            throw new Error('Project already exists')
        }

        const metaTitle = `${process.env.SERVER_URL}/default.meta`
        const repoUrl = `${process.env.GRAPHDB_URL}/rest/repositories/${fullTitle}`

        // project title must be unique
        if (req.user.projects.includes(repoUrl)) {
            throw new Error('Project already exists. Please specify a unique name.')
        }

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
        return res.status(500).send({ error: error.toString() })
    }
}

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
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
}

// send back project metadata and named graphs.
getOneProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user
        const projectGraph = await graphStore.getNamedGraph(`${process.env.SERVER_URL}/default.meta`, projectName, '', 'turtle')
        const allNamed = await graphStore.getAllNamedGraphs(projectName, '')
        let namedUris = []
        allNamed.results.bindings.forEach(result => {
            if (!result.contextID.value.endsWith('acl') && !result.contextID.value.endsWith('meta')) {
                namedUris.push(result.contextID.value)
            }
        })
        
        return res.status(200).json({ projectGraph, contains: namedUris })
    } catch (error) {
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
}

// updates the main project data. Not expected to happen very much. 
// discuss implementation. This will actually use the updateNamedGraph function on the .meta graph of the project.
// updateProject = async (req, res) => {
//     try {
//         const projectName = req.params.projectName
//         const owner = req.user
//         const body = req.body
//         // updates docdbinformation
//         // if id or uri changes, also update graphdb
//         const documentData = await docStore.updateProjectDoc({ _id, body, owner })
//         return res.status(documentData.status).json({ project: documentData.project, nonPermittedUpdates: documentData.notPermitted })
//     } catch (error) {
//         console.log('error', error)
//         return res.status(404).json({ message: 'Project not found' })
//     }
// }

deleteProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user

        // delete from graph store
        await graphStore.deleteRepository(projectName)
        // delete from list in document store (user)
        let newProjectList = owner.projects.filter(project => {
            return project.Graph_url !== `${process.env.GRAPHDB_URL}/rest/repositories/${projectName}`
        })
        owner.projects = newProjectList
        await owner.save()

        return res.status(200).json({ message: `Project ${projectName} was deleted.` })
    } catch (error) {
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
}

//////////////////////////// QUERY API ///////////////////////////////
queryProject = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const query = encodeURIComponent(req.query.query)
            const projectName = req.params.projectName
            const results = await graphStore.queryRepository(projectName, query)
            return res.status(200).send({ results })
        } else if (req.method === 'POST') {
            const update = encodeURIComponent(req.query.update)
            const projectName = req.params.projectName
            await graphStore.updateRepositorySparql(projectName, update)
            return res.status(204).send()
        }
    } catch (error) {
        console.log('error', error)
        return res.status(500).send(({ error: error.toString() }))
    }
}

//////////////////////////// document API ///////////////////////////////
uploadDocumentToProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user.url
        const data = req.file.buffer

        // upload document
        // attach document information to graphdb
        const documentData = await docStore.uploadDocuments(projectName, data, owner)

        return res.status(documentData.status).json({ url: documentData.file })
    } catch (error) {
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
}

getDocumentFromProject = async (req, res) => {
    try {
        // only access docdb
        const projectName = req.params.projectName
        const fileId = req.params.fileId
        const owner = req.user.url
        const file = await docStore.getDocument(projectName, fileId)

        return res.status(file.status).json({ file: file.file })
    } catch (error) {
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
}

deleteDocumentFromProject = async (req, res) => {
    try {
        await docStore.deleteDocument(req.params.fileId)
        return res.status(200).send({ message: 'Document deleted' })
    } catch (error) {
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
}

//////////////////////////// NAMED GRAPHS API ///////////////////////////////
getNamedGraph = async (req, res) => {
    try {
        const projectId = req.params.projectName
        const namedGraph = req.query.graph
    
        const graph = await graphStore.getNamedGraph(namedGraph, projectId, '', 'turtle')
        return res.json({ graph })
    } catch (error) {
        console.log('error', error)
        return res.status(500).send({ error: error.toString() })
    }
}

updateNamedGraph = async (req, res) => {
    try {

        return res.json({ message: 'this function is not implemented yet' })
    } catch (error) {
        return res.status(500).send({ error: error.toString() })
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
                console.log('result.contextID.value', result.contextID.value)
            }
        })

        for await (graph of graphsToDelete) {
            graphStore.deleteNamedGraph(graph, projectName, '')
        }

        return res.status(200).json({ message: 'The named graph was successfully deleted' })
        
    } catch (error) {
        console.log('error', error)
        return res.status(500).send({ error: error.toString() })
    }
}

createNamedGraph = async (req, res) => {
    try {
        const projectName = req.params.projectName
        let acl
        if (!req.body.acl && !req.files.acl) {
            acl = 'https://lbdserver.com/acl/private'
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
            acl = 'https://lbdserver.com/acl/private'
        } else if (req.body.acl === 'public' || req.body.acl === 'https://lbdserver.com/acl/public') {
            acl = 'https://lbdserver.com/acl/public'
        }

        const graphData = {
            context: req.body.context,
            baseURI: req.body.context + '#',
            data: req.files.graph[0].buffer.toString(),
            acl
        }

        let label, description
        if (req.body.label) {
            label = req.body.label
            graphData.label = label
        }
        if (req.body.description) {
            description = req.body.description
            graphData.description = description
        }

        const graph = await graphStore.createNamedGraph(projectName, graphData, '')
        const graphMetaData = await graphStore.namedGraphMeta(graphData.context, acl, req.user.url, label, description)
        const graphMeta = {
            context: req.body.context + '.meta',
            baseURI: req.body.context + '.meta#',
            data: graphMetaData
        }

        await graphStore.createNamedGraph(projectName, graphMeta, '')

        return res.json({ message: 'Successfully created the named graph' })
    } catch (error) {
        console.log('error', error)
        return res.status(404).send({ error: error.toString() })
    }
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
    deleteNamedGraph,
    updateNamedGraph
}
