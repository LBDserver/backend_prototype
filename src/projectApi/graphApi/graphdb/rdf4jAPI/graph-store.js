const request = require('request');
const defaultBody = require('../util/createGraphBody')
const axios = require('axios')
const FormData = require('form-data')

createNamedGraph = (repositoryId, { context, baseURI, data }, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const body = JSON.stringify(defaultBody(context, baseURI, data))

            const options = {
                'method': 'post',
                'url': `http://localhost:7200/rest/data/import/upload/${repositoryId}/text`,
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: body
            };

            const response = await axios(options)
            resolve(response.data)

        }  catch (error) {
            console.log('error', error)
            if (error.response.data) {
                reject({ reason: `Graph Database error: ${error.response.data}`, status: error.response.status })
            } else {
                reject({ reason: "Internal server error", status: 500 })
            }
        }
    })
}

getNamedGraph = (namedGraph, repositoryId, token, format) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mimeTypes = {
                "turtle": "text/turtle"
            }

            const mimeType = mimeTypes[format]

            var options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs/service?graph=${namedGraph}\n`,
                'headers': {
                    'Accept': `${mimeType}`,
                    'Authorization': `Bearer ${token}`
                }
            };
            const response = await axios(options)
            resolve(response.data)
        }  catch (error) {
            if (error.response.data) {
                reject({ reason: `Graph Database error: ${error.response.data}`, status: error.response.status })
            } else {
                reject({ reason: "Internal server error", status: 500 })
            }
        }
    })
}

deleteNamedGraph = (namedGraph, repositoryId, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData()
            formData.append('update', `CLEAR GRAPH <${namedGraph}>`)
            const url = `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/statements`
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
            }

            const response = await axios.post(url, formData, { headers })
            resolve(response.data)

        }  catch (error) {
            if (error.response.data) {
                reject({ reason: `Graph Database error: ${error.response.data}`, status: error.response.status })
            } else {
                reject({ reason: "Internal server error", status: 500 })
            }
        }
    })
}

getAllNamedGraphs = (repositoryId, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs`
            };
            const response = await axios(options)
            resolve(response.data)

        } catch (error) {
            if (error.response.data) {
                reject({ reason: `Graph Database error: ${error.response.data}`, status: error.response.status })
            } else {
                reject({ reason: "Internal server error", status: 500 })
            }
        }
    })
}

module.exports = {
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    getAllNamedGraphs
}