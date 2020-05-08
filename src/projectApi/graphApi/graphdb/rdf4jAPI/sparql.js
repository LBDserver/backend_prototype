const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');


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
            console.log('error', error)
            if (error.response.data) {
                reject({ reason: `Graph Database error: ${error.response.data}`, status: error.response.status })
            } else {
                reject({ reason: "Internal server error", status: 500 })
            }
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
        }  catch (error) {
            if (error.response.data) {
                reject({ reason: `Graph Database error: ${error.response.data}`, status: error.response.status })
            } else {
                reject({ reason: "Internal server error", status: 500 })
            }
        }
    })
}

module.exports = {
    queryRepository,
    updateRepositorySparql
}