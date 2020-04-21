const { repoConfig } = require('../../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');


const axios = require('axios')

const gdbURI = 'http://localhost:7200'

login = async (username, password) => {
    try {
        const options = {
            'method': 'POST',
            'url': `${gdbURI}/rest/login/${username}`,
            'headers': {
                'Accept': 'application/json',
                'X-GraphDB-Password': password
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
    login
}