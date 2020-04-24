const {
    createProjectDoc,
    getProjectDoc,
    deleteProjectDoc,
    uploadDocuments,
    deleteDocuments,
    getProjectsDoc,
    updateProjectDoc,
    getProjectFile,
    migrateMongo
} = require('./mongoApi')

module.exports = {
    getProjectsDoc,
    createProjectDoc,
    getProjectDoc,
    deleteProjectDoc,
    uploadDocuments,
    deleteDocuments,
    updateProjectDoc,
    getProjectFile,
    migrateMongo
}