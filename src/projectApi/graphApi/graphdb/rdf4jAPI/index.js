const {
    queryRepository,
    updateRepositorySparql
} = require('./sparql')

const {
    createNamedGraph,
    updateNamedGraph,
    deleteNamedGraph
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
    updateNamedGraph,
    deleteNamedGraph,
    createNameSpace,
    deleteNameSpace,
    getNameSpace
}