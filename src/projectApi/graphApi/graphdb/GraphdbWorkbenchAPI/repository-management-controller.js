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
            const repositories = await axios(options)
            resolve(repositories.data)
        } catch (error) {
            console.log('error', error)
            reject(error)
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
            const repositories = await axios(options)
            resolve(repositories.data)
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

createRepository = (title, id) => {
    return new Promise((resolve, reject) => {
        try {
            let repoconfig = repoConfig(title, id)
    
            var options = {
                'method': 'POST',
                'url': `${process.env.GRAPHDB_URL}/rest/repositories`,
                'headers': {
                    'Content-Type': 'multipart/form-data'
                },
                formData: {
                    'config': {
                        'value': Buffer.from(repoconfig),
                        'options': {
                            'filename': 'repoconfig.ttl',
                            'contentType': null
                        }
                    }
                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body)
            });

        } catch (error) {
            console.log('error', error)
            reject(error)
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
            const repositories = await axios(options)
            resolve(repositories.data)
        } catch (error) {
            console.log('error', error)
            throw new Error(error)
        }
    })
}

module.exports = {
    getRepositories,
    getRepository,
    createRepository,
    deleteRepository,
}