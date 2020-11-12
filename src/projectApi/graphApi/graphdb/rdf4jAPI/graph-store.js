const defaultBody = require('../util/createGraphBody')
const axios = require('axios')
const FormData = require('form-data')
const errorHandlerAxios = require('../../../../util/errorHandlerAxios')

createNamedGraph = (repositoryId, { context, baseURI, data }, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = JSON.stringify(defaultBody(context, baseURI, data))

            const options = {
                'method': 'post',
                'url': `http://localhost:7200/rest/data/import/upload/${repositoryId}/text`,
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.GDB_ADMIN
                },
                data: body
            };

            const response = await axios(options)
            resolve(response.data)

        } catch (error) {
            const {reason, status} = errorHandlerAxios(error)
            reject({ reason, status })
        }
    })
}

getNamedGraph = (namedGraph, repositoryId, token, format) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('getting')
            const mimeTypes = {
                "turtle": "text/turtle"
            }

            const mimeType = mimeTypes[format]

            var options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs/service?graph=${namedGraph}\n`,
                'headers': {
                    'Accept': `${mimeType}`,
                    'Authorization': process.env.GDB_ADMIN
                }
            };

            console.log('options', options)
            const response = await axios(options)
            resolve(response.data)
        } catch (error) {
            const {reason, status} = errorHandlerAxios(error)
            reject({ reason, status })
        }
    })
}

deleteNamedGraph = (namedGraph, repositoryId, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData()
            console.log('clearing Graph ', namedGraph)
            formData.append('update', `CLEAR GRAPH <${namedGraph}>`)
            const url = `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/statements`
            const headers = {
                'Authorization': process.env.GDB_ADMIN,
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
            }

            const response = await axios.post(url, formData, { headers })
            resolve(response.data)

        } catch (error) {
            const {reason, status} = errorHandlerAxios(error)
            reject({ reason, status })
        }
    })
}

getAllNamedGraphs = (repositoryId, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs`,
                'headers': {
                    'Authorization': process.env.GDB_ADMIN
                }
            };
            const response = await axios(options)
            resolve(response.data)

        } catch (error) {
            const {reason, status} = errorHandlerAxios(error)
            reject({ reason, status })
        }
    })
}

module.exports = {
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    getAllNamedGraphs
}