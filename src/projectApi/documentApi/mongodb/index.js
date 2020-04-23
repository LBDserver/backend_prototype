const {
    createProjectDoc,
    getProjectDoc,
    deleteProjectDoc,
    uploadDocuments,
    removeDocuments,
    getProjectsDoc,
    updateProjectDoc,
    getProjectFile
} = require('./mongoApi')

module.exports = {
    getProjectsDoc,
    createProjectDoc,
    getProjectDoc,
    deleteProjectDoc,
    uploadDocuments,
    removeDocuments,
    updateProjectDoc,
    getProjectFile
}