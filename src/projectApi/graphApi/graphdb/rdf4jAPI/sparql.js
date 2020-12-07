const { repoConfig } = require('../util/repoConfig')
const FormData = require('form-data')
var fs = require('fs');
const errorHandlerAxios = require('../../../../util/errorHandlerAxios')
const btoa = require('btoa-lite')


const axios = require('axios')

queryRepository = (id, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${id}?query=${query}`,
                'headers': {
                    'Accept': 'application/sparql-results+json',
                    'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
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
                    'Accept': 'application/json',
                    'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
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