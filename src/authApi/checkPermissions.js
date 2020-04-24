const { model } = require('mongoose')
const { User, Project, File, Graph } = require('../projectApi/documentApi/mongodb/models')

checkPermissions = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.SERVER_URL}${req.originalUrl}`
            const user = req.user.url
            const requestedPermissions = setRequestedPermissions(req.method)
            const resource = await getResource(url)

            switch (resource.acl) {
                case 'https://lbdserver.com/acl/public':
                    resolve()
                case 'https://lbdserver.com/acl/private':
                    if (resource.owner === user) {
                        resolve()
                    } else if (resource.url === user) {  // user fetches own document
                        resolve()
                    } else {
                        reject()
                    }
                default:
                    reject('default')
            }
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getResource = (url, user) => {
    return new Promise(async (resolve, reject) => {
        try {
            // make superclass 'resource' to fetch the acl
            let resource = await User.findOne({ url })

            if (!resource) {
                throw new Error('Resource not found')
            }
            resolve(resource)
        } catch (error) {
            reject(error)
        }
    })
}

setRequestedPermissions = (method) => {
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