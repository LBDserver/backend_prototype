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
    deleteNamedGraph,
    getNamedGraph,
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
    deleteNamedGraph,
    getNamedGraph,
    createNameSpace,
    deleteNameSpace,
    getNameSpace
}