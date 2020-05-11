const { repoConfig } = require('../util/repoConfig')
const FormData = require('form-data')
var fs = require('fs');
const errorHandlerAxios = require('../../../../util/errorHandlerAxios')


const axios = require('axios')

queryRepository = (id, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${id}?query=${query}`,
                'headers': {
                    'Accept': 'application/sparql-results+json'
                }
            };
            const results = await axios(options)
            resolve(results.data)
        } catch (error) {
            const { reason, status } = errorHandlerAxios(error)
            reject({ reason, status })
        }
    })
}

// baseURI not yet implemented, though supported by REST API of graphdb
updateRepositorySparql = (id, update) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'POST',
                'url': `${process.env.GRAPHDB_URL}/repositories/${id}/statements?update=${update}`,
                'headers': {
                    'Accept': 'application/json'
                }
            };
            response = await axios(options)
            resolve(response.data)
        } catch (error) {
            const { reason, status } = errorHandlerAxios(error)
            reject({ reason, status })
        }
    })
}

module.exports = {
    queryRepository,
    updateRepositorySparql
}