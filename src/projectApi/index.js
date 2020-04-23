const {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    uploadDocumentToProject,
    getDocumentFromProject
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
    getDocumentFromProject
}