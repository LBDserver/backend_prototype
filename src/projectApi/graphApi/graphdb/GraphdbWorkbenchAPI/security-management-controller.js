const { repoConfig } = require('../util/repoConfig')
const request = require('request');
const FormData = require('form-data')
var fs = require('fs');
const axios = require('axios')
const btoa = require('btoa-lite')

getUsers = async (username, token) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user`,
            'headers': {
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
            }
        };
        const users = await axios(options)
        return users
    } catch (error) {
        throw error
    }
}

getUser = async (username, token) => {
    try {
        const options = {
            'method': 'GET',
            'url': `${process.env.GRAPHDB_URL}}/rest/security/user/${username}`,
            'headers': {
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
            }
        };
        const user = await axios(options)
        return user

    } catch (error) {
        throw error
    }
}

createUser = async (username, password, token) => {
    try {
        const options = {
            'method': 'POST',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user/${username}`,
            'headers': {
                'Content-Type': ['application/json', 'text/plain'],
                'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
            },
            body: JSON.stringify({username})
        };

        request(options, function (error, response) {
            if (error) error.message = (error);
        });
        return

    } catch (error) {
        console.log('error', error)
        throw error
    }
}

deleteUser = async (username, token) => {
    try {
        const options = {
            'method': 'DELETE',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user/${username}`,
            'headers': {
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
            }
        };
        const user = await axios(options)
        return user

    } catch (error) {
        console.log('error', error)
        throw error
    }
}

updateUser = async (username, password, body, token) => {
    try {
        const options = {
            'method': 'PUT',
            'url': `${process.env.GRAPHDB_URL}/rest/security/user/${username}`,
            'headers': {
                'Content-Type': ['application/json', 'text/plain'],
                'Authorization': `Basic ${btoa(process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW)}`
            },
            body: JSON.stringify(body)
        };

        request(options, function (error, response) {
            if (error) error.message = (error);
        });
        return

    } catch (error) {
        console.log('error', error)
        throw error
    }
}

module.exports = {
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createUser
}