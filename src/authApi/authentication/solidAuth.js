const auth = require('solid-auth-cli')
const fetch = require('node-fetch')
const { PathFactory } = require('ldflex');
const { default: ComunicaEngine } = require('@ldflex/comunica');
const { namedNode } = require('@rdfjs/data-model');


authenticateSolid = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const creds = extractCredentials(req)
            const session = await auth.login(creds)
    
            req.session = JSON.stringify(session)
            const webId = session.webId
            const user = await fetch(webId, {
                headers: {
                    'Content-Type': "text/turtle"
                }
            })
            console.log(user.response)
            resolve(user)
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

function extractCredentials (req) {
    try {
        const authorization = req.headers.authorization
        const basic = authorization.split(' ')
        let buff = Buffer.from(basic[1], 'base64')
        let [un_idp, pw] = buff.toString('ascii').split(':')
        un_idp = un_idp.split('.')
        const un = un_idp.shift()
        let idp = 'https://'
        un_idp.forEach(i => {
            idp += i + '.'
        })
        idp = idp.substring(0, idp.length - 1) + '/'
        return { idp, username: un, password: pw }
    } catch (error) {
        return error
    }
}

module.exports = { authenticateSolid }