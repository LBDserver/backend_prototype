const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');


const axios = require('axios')

const gdbURI = 'http://localhost:7200'

queryRepository = async (id, query) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${gdbURI}/repositories/${id}?query=${query}`,
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
            'url': `${gdbURI}/repositories/${id}/statements?update=${update}`,
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