const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');


const axios = require('axios')

const gdbURI = 'http://localhost:7200'

getUsers = async (username, token) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user`,
            'headers': {
                'Accept': 'application/json'
            }
        };
        const users = await axios(options)
        return users
    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

getUser = async (username, token) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}}/rest/security/user/${username}`,
            'headers': {
                'Accept': 'application/json'
            }
        };
        const user = await axios(options)
        return user

    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

createUser = async (username, password, token) => {
    try {
        const options = {
            'method': 'POST',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user/${username}`,
            'headers': {
                'Content-Type': ['application/json', 'text/plain'],
                'X-GraphDB-Password': password,
                'Authorization': token
            },
            body: JSON.stringify({username})
        };

        request(options, function (error, response) {
            if (error) throw new Error(error);
        });
        return

    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

deleteUser = async (username, token) => {
    try {
        const options = {
            'method': 'DELETE',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user/${username}`,
            'headers': {
                'Accept': 'application/json',
                'Authorization': token
            }
        };
        const user = await axios(options)
        return user

    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

updateUser = async (username, password, body, token) => {
    try {
        const options = {
            'method': 'PUT',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user/${username}`,
            'headers': {
                'Content-Type': ['application/json', 'text/plain'],
                'X-GraphDB-Password': password,
            },
            body: JSON.stringify(body)
        };

        request(options, function (error, response) {
            if (error) throw new Error(error);
        });
        return

    } catch (error) {
        console.log('error', error)
        throw new Error(error)
    }
}

module.exports = {
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createUser
}