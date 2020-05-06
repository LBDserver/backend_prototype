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
            let meta, acl
            // check which acl file is used for the resource and action
                // create project: none
                // update project: project WRITE
                // delete project: project CONTROL
                // read project: project READ
                
                // create named graph: project WRITE
                // read named graph: graph READ
                // update named graph: graph WRITE
                // delete named graph: graph CONTROL

                // create document: project WRITE
                // read document: document READ
                // delete document: document CONTROL
                // change acl: document CONTROL

                // ? this poses an issue, as a acl file can be used by multiple resources.
                // => ! what if an acl is used by multiple graphs => create duplicate, change duplicate and refer to duplicate. Else: change acl graph
                // if the project acl has multiple owners, all of them must agree on changing it.
                // read acl file: CONTROL
                // change acl file: CONTROL
            resolve(acl)
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