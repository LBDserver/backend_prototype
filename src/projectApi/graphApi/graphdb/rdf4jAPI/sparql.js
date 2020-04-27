const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');


const axios = require('axios')

queryRepository = async (id, query) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}/repositories/${id}?query=${query}`,
            'headers': {
                'Accept': 'application/sparql-results+xml'
            }
        };
        const results = await axios(options)
        return results
    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

// baseURI not yet implemented, though supported by REST API of graphdb
updateRepositorySparql = async (id, update) => {
    try {
        const options = {
            'method': 'POST',
            'url': `${process.env.GRAPHDB_URL}/repositories/${id}/statements?update=${update}`,
            'headers': {
                'Accept': 'application/json'
            }
        };
        response = await axios(options)
        return response
    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

module.exports = {
    queryRepository,
    updateRepositorySparql
}