const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');


const axios = require('axios')

getRepositories = async () => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}/rest/repositories`,
            'headers': {
                'Accept': 'application/json'
            }
        };
        const repositories = await axios(options)
        return repositories.data
    } catch (error) {
        throw new Error(error)
    }
}

getRepository = async (id) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}/rest/repositories/${id}`,
            'headers': {
                'Accept': 'application/json'
            }
        };
        const repositories = await axios(options)
        return repositories.data
    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

createRepository = async (doc) => {
    try {
        let repoconfig = repoConfig(doc.title, doc.id)

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
        });

        return 200

    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

deleteRepository = async (id) => {
    try {
        const options = {
            'method': 'DELETE',
            'url': `${process.env.GRAPHDB_URL}/rest/repositories/${id}`,
            'headers': {
                'Accept': 'application/json'
            }
        };
        const repositories = await axios(options)
        return repositories.data
    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

module.exports = {
    getRepositories,
    getRepository,
    createRepository,
    deleteRepository,
}