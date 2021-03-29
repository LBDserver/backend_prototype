const {
    createRepository,
    getRepositories,
    getRepository,
    deleteRepository
    // login,
    // getUser,
    // getUsers,
    // deleteUser,
    // updateUser,
    // createUser
} = require('./GraphdbWorkbenchAPI')

const {
    queryRepository,
    updateRepositorySparql,

    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    getAllNamedGraphs,
    replaceNamedGraph,
    updateNamedGraph,
    queryNamedGraph,

    createNameSpace,
    deleteNameSpace,
    getNameSpace
} = require('./rdf4jAPI')

const {
    createGraphBody,
    namedGraphMeta,
    repoConfig,
    aclMeta,
    createDCATResourceMeta,
    createDCATProjectMeta
} = require('./util')

module.exports = {
    createRepository,
    getRepositories,
    getRepository,
    deleteRepository,

    // login,
    // getUser,
    // getUsers,
    // deleteUser,
    // updateUser,
    // createUser,

    queryRepository,
    updateRepositorySparql,
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    getAllNamedGraphs,
    createNameSpace,
    deleteNameSpace,
    getNameSpace,
    createGraphBody,
    namedGraphMeta,
    aclMeta,
    repoConfig,
    // replaceNamedGraph,
    // updateNamedGraph,
    // queryNamedGraph

    createDCATProjectMeta,
    createDCATResourceMeta
}