const {
    queryRepository,
    updateRepositorySparql
} = require('./sparql')

const {
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    getAllNamedGraphs
} = require('./graph-store')

const {
    createNameSpace,
    deleteNameSpace,
    getNameSpace
} = require('./namespaces')

module.exports = {
    queryRepository,
    updateRepositorySparql,
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    createNameSpace,
    deleteNameSpace,
    getNameSpace,
    getAllNamedGraphs
}