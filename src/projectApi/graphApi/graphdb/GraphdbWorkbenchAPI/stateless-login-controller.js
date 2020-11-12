const { repoConfig } = require('../util/repoConfig')
const FormData = require('form-data')
var fs = require('fs');


const axios = require('axios')

login = async (username, password) => {
    try {
        const options = {
            'method': 'POST',
            'url': `${process.env.GRAPHDB_URL}/rest/login/${username}`,
            'headers': {
                'Accept': 'application/json',
                'Authorization': process.env.GDB_ADMIN
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