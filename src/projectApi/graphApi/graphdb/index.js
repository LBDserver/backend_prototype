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
    updateRepositorySparql,
    createNamedGraph,
    updateNamedGraph,
    deleteNamedGraph,
    createNameSpace,
    deleteNameSpace,
    getNameSpace
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
    updateRepositorySparql,
    createNamedGraph,
    updateNamedGraph,
    deleteNamedGraph,
    createNameSpace,
    deleteNameSpace,
    getNameSpace
}