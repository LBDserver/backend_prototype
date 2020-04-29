const { model } = require('mongoose')
const { User, Project, File } = require('../projectApi/documentApi/mongodb/models')
const graphStore = require('../projectApi/graphApi/graphdb')

checkPermissions = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.SERVER_URL}${req.originalUrl}`
            const aclUrl = getAcl(url)
            const permissions = getPermissions(req.method)
 
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getAcl = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let meta
            resolve()


        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getPermissions = (method) => {
    switch (method) {
        case 'GET':
            return ['acl:Read']
        case 'POST':
            return ['acl:Write']
        case 'PUT':
            return ['acl:Write']
        case 'PATCH':
            return ['acl:Write']
        case 'DELETE':
            return ['acl:Write']
        default:
            return []
    }
}

module.exports = { checkPermissions }