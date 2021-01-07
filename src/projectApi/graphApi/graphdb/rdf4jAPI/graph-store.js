const defaultBody = require('../util/createGraphBody')
const axios = require('axios')
const FormData = require('form-data')
const errorHandlerAxios = require('../../../../util/errorHandlerAxios')
const btoa = require('btoa-lite')


async function createNamedGraph (repositoryId, { namedGraph, baseURI, data }, token) {
        try {
            const body = JSON.stringify(defaultBody(namedGraph, baseURI, data))

            const options = {
                'method': 'post',
                'url': `http://localhost:7200/rest/data/import/upload/${repositoryId}/text`,
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
                },
                data: body
            };

            const response = await axios(options)
            return(response.data)

        } catch (error) {
            throw new Error(`Failed to create named graph ${namedGraph}; ${error.message}`)
        }
    
}

async function getNamedGraph (namedGraph, repositoryId, token, format) {
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
                    'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
                }
            };

            const response = await axios(options)
            return(response.data)
        } catch (error) {
            throw new Error(`Error fetching named graph ${namedGraph}; ${error.message}`)
        }
}

async function deleteNamedGraph (namedGraph, repositoryId, token) {
    try {
        const formData = new FormData()
        console.log('clearing Graph ', namedGraph)
        formData.append('update', `CLEAR GRAPH <${namedGraph}>`)
        const url = `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/statements`
        const headers = {
            'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`,
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
        }
        const response = await axios.post(url, formData, { headers })
        return(response.data)
    } catch (error) {
        throw new Error(`Failed to delete named graph ${namedGraph}; ${error.message}`)
    }
}

async function getAllNamedGraphs(repositoryId, token) {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs`,
                'headers': {
                    'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
                }
            };
            const response = await axios(options)
            return (response.data)

        } catch (error) {
            throw new Error(`Error fetching  all named Graphs; ${error.message}`)
        }
    })
}

module.exports = {
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph,
    getAllNamedGraphs
}