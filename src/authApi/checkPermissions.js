const { model } = require('mongoose')
const { User, Project, File } = require('../projectApi/documentApi/mongodb/models')
const graphStore = require('../projectApi/graphApi/graphdb')

checkPermissions = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.SERVER_URL}${req.originalUrl}`
            const user = req.user.url

            const fileType = getFileType(url, req)
            const aclUrl = getAcl(fileType, req)
            const permissions = getPermissions(req.method)

 
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getFileType = (url, req) => {
    let fileType 
    console.log('req.params', typeof req.params)
    if (Object.keys(req.params).includes('projectName') && Object.keys(req.params).includes('fileId')) {
        fileType = 'file'
    } else if (Object.keys(req.params).includes('projectName') && url.endsWith('graphs')) {
        fileType = 'graph'
    } else if (Object.keys(req.params).includes('projectName') && !url.endsWith('graphs')) {
        fileType = 'project'
    } else {
        fileType = 'user'
    }
    return fileType
}

getAcl = (fileType, req) => {
    return new Promise(async (resolve, reject) => {
        try {
            let data
            switch(fileType) {
                case 'file': 
                    data = await File.findById(req.params.fileId)
                    if (!data) {
                        throw new Error('File not found')
                    }
                    resolve({data, acl: data.acl})
                case 'user':
                    data = await User.findOne({url})
                    if (!data) {
                        throw new Error('File not found')
                    }
                    resolve({data, acl: data.acl})
                case 'graph':
                    const namedGraph = req.query.graph
                    const sparql = encodeURIComponent(`PREFIX lbd: <https://lbdserver.com/vocabulary#> SELECT ?acl FROM ${namedGraph}.meta WHERE {?s lbd:hasAcl ?acl}`)
                    data = graphStore.queryRepository(req.params.projectName, sparql)
                    console.log('data', data)
                    resolve({data})
                default:
                    throw new Error('was not able to find the ACL file for this request')
            }
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