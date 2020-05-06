const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');

// create project repository docdb, get project_id
//const documentData = await docStore.createProjectDoc({ ...req.body, owner})

// create project repository graphdb
const axios = require('axios')

getRepositories = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/rest/repositories`,
                'headers': {
                    'Accept': 'application/json'
                }
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

getRepository = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/rest/repositories/${id}`,
                'headers': {
                    'Accept': 'application/json'
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

createRepository = (title, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let repoconfig = repoConfig(title, id)

            const formData = new FormData()

            formData.append('config', repoconfig, 'config')
            const url = `${process.env.GRAPHDB_URL}/rest/repositories`
            const headers = { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` }


            const response = await axios.post(url, formData, {headers})
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

deleteRepository = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const options = {
                'method': 'DELETE',
                'url': `${process.env.GRAPHDB_URL}/rest/repositories/${id}`,
                'headers': {
                    'Accept': 'application/json'
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

module.exports = {
    getRepositories,
    getRepository,
    createRepository,
    deleteRepository,
}