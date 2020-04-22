const {
    createProjectDoc,
    getProjectDoc,
    deleteProjectDoc,
    uploadDocuments,
    removeDocuments,
    getProjectsDoc,
    updateProjectDoc
} = require('./mongoApi')

module.exports = {
    getProjectsDoc,
    createProjectDoc,
    getProjectDoc,
    deleteProjectDoc,
    uploadDocuments,
    removeDocuments,
    updateProjectDoc
}