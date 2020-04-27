const graphStore = require('./graphApi/graphdb')
const docStore = require('./documentApi/mongodb')

createProject = async (req, res) => {
    try {
        const owner = req.user._id

        // create project repository docdb, get project_id
        const documentData = await docStore.createProjectDoc({ ...req.body, owner})

        // create project repository graphdb
        const graphData = await graphStore.createRepository(documentData)
        
        // create named graph for the project
        const projectGraph = await graphStore.createNamedGraph(graphdData)

        // update graph with project information
        const pushProjectInfo = await graphStore.uploadNamedGraph()
        

        return res.status(201).json({ documentData, graphData })
    } catch (error) {
        return res.json({ error })
    }
}

getAllProjects = async (req, res) => {
    try {
        const owner = req.user._id
        // get projectdata from docdb
        // get projectURIs with sparql
        // combine results
        const documentData = await docStore.getProjectsDoc({owner})

        return res.status(documentData.status).json({ projects: documentData.projects })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ error })
    }
}

getOneProject = async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        // get projectdata from docdb
        // get projectURIs with sparql
        // combine results
        const documentData = await docStore.getProjectDoc({_id, owner})
        const project = documentData.project
        const files = documentData.files
        return res.status(documentData.status).json({ project, files })
    } catch (error) {
        return res.status(404).json({ message: 'Project not found' })
    }
}

updateProject = async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        const body = req.body
        // updates docdbinformation
        // if id or uri changes, also update graphdb
        const documentData = await docStore.updateProjectDoc({_id, body, owner})
        return res.status(documentData.status).json({ project: documentData.project, nonPermittedUpdates: documentData.notPermitted })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ message: 'Project not found' })
    }
}

deleteProject = async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        // delete project from docdb
        // delete project from graphdb
        const documentData = await docStore.deleteProjectDoc({_id, owner})

        return res.status(documentData.status).json({ project: documentData.project })
    } catch (error) {
        return res.status(404).json({message: "Project not found"})
    }
}

uploadDocumentToProject = async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        const main = req.file.buffer

        // upload document
        // attach document information to graphdb
        const documentData = await docStore.uploadDocuments({_id, main, owner})
        return res.status(documentData.status).json({ url: documentData.file.url })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ message: 'Project not found' })
    }
}

queryProject = async (req, res) => {
    // query project with sparql
    // add option to immediately fetch files (getFile)
    return res.json({ message: 'this function is not implemented yet' })
}

getDocumentFromProject = async (req, res) => {
    try {
        // only access docdb
        const projectId = req.params.id
        const fileId = req.params.fileId
        const owner = req.user._id
        const file = await docStore.getProjectFile({projectId, fileId, owner})

        return res.status(file.status).json({ file: file.file })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ error })
    }
}

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    getDocumentFromProject,
    uploadDocumentToProject
}