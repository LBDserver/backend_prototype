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

const {
    createGraphBody,
    namedGraphMeta,
    repoConfig
} = require('./util')

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
    getNameSpace,
    createGraphBody,
    namedGraphMeta,
    repoConfig
}