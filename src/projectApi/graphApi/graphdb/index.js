const {
    createRepository,
    getRepositories,
    getRepository,
    deleteRepository,
    login,
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createUser
} = require('./GraphdbWorkbenchAPI')

const {
    queryRepository,
    updateRepositorySparql
} = require('./rdf4jAPI')

module.exports = {
    createRepository,
    getRepositories,
    getRepository,
    deleteRepository,
    login,
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createUser,
    queryRepository,
    updateRepositorySparql
}