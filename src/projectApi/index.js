const {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    uploadDocumentToProject,
    getFile
} = require('./lbdApi')

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