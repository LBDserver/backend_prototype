const {
    getAllProjects,
    createProject,
    getOneProject,
    deleteProject,
    queryProject,
    uploadDocumentToProject,
    getDocumentFromProject,
    deleteDocumentFromProject,
    getNamedGraph,
    deleteNamedGraph,
    createNamedGraph,
    updateProject,
    getPublicProjects
} = require('./lbdApi')

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    deleteProject,
    updateProject,
    queryProject,
    uploadDocumentToProject,
    getDocumentFromProject,
    deleteDocumentFromProject,
    getNamedGraph,
    deleteNamedGraph,
    createNamedGraph,
    getPublicProjects
}