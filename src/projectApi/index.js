const {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    uploadDocumentToProject,
    getFile
} = require('./basicApi')

const {getProjectConfig} = require('./basicConfig')

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    getProjectConfig,
    uploadDocumentToProject,
    getFile
}