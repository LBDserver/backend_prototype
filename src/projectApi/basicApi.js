const graphStore = require('./graphApi/graphdb')
const docStore = require('./documentApi/mongodb')

createProject = async (req, res) => {
    try {
        const documentData = await docStore.createProjectDoc(req.body)

        return res.status(documentData.status).json({project: documentData.project})
    } catch (error) {
        return res.json({ error })
    }
}

getAllProjects = async (req, res) => {
    try {
        const documentData = await docStore.getProjectsDoc()

        return res.status(documentData.status).json({projects: documentData.projects})
    } catch (error) {
        console.log('error', error)
        return res.json({ error })
    }
}

getOneProject = async (req, res) => {
    const id = req.params.id
    try {
        const documentData = await docStore.getProjectDoc(id)
        const project = documentData.project
        const files = documentData.files
        return res.status(documentData.status).json({project, files})
    } catch (error) {
        return res.json({ error })
    }
}

updateProject = async (req, res) => {
    const id = req.params.id
    try {
        const documentData = await docStore.updateProjectDoc(id, req.body)
        console.log('documentData', documentData.status)
        return res.status(documentData.status).json({project: documentData.project, notPermittedUpdates: documentData.notPermitted})
    } catch (error) {
        console.log('error', error)
        return res.status(400).json({ error })
    }
}

deleteProject = async (req, res) => {
    const id = req.params.id
    try {
        const documentData = await docStore.deleteProjectDoc(id)

        return res.status(documentData.status).json({project: documentData.project})
    } catch (error) {
        return res.json({ error })
    }
}

uploadDocumentToProject = async (req, res) => {
    const id = req.params.id
    const uri = 'http://testuri.com/test123'
    try {
        const documentData = await docStore.uploadDocuments(id, req.file.buffer, uri)

        return res.status(documentData.status).json({project: documentData.project})
    } catch (error) {
        return res.json({ error })
    }
}

queryProject = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

getFile = async (req, res) => {
    const projectId = req.params.id
    const uri = req.query.uri
    try {
        const file = await docStore.getProjectFile(projectId, uri)

        return res.status(file.status).json({file: file.file})
    } catch (error) {
        console.log('error', error)
        return res.json({ error })
    }
}

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    getFile,
    uploadDocumentToProject
}