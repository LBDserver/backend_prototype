const { model } = require('mongoose')
const { User, Project, File } = require('../projectApi/documentApi/mongodb/models')
const graphStore = require('../projectApi/graphApi/graphdb')

checkPermissions = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const projectName = req.params.projectName
            const url = `${process.env.SERVER_URL}${req.originalUrl}`
            const type = await getType(url, req.path)
            const requestedPermissions = requestPermissions(req.method, url, type)

            // if file is not acl
            const aclUrl = await getAcl(req, url, type)

            console.log('aclUrl', aclUrl)

            const permissions = await queryPermissions(req.user.url, aclUrl, projectName)
            // reject('stop')
            resolve()
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}


getAcl = (req, url, type) => {
    return new Promise(async (resolve, reject) => {
        try {

            let metaGraph, subject
            const projectName = req.params.projectName
            const graph = req.query.graph

            switch (type) {
                case 'PROJECT':
                    subject = url
                    metaGraph = `${url}/default.meta`
                    break;
                case 'GRAPH':
                    if (req.method == 'POST') {
                        subject = `${process.env.SERVER_URL}/project/${projectName}`
                        metaGraph = subject + '/default.meta'
                    } else {
                        subject = graph
                        metaGraph = `${graph}.meta`
                    }
                    break;
                case 'FILE':
                    if (req.method == 'POST') {
                        subject = `${process.env.SERVER_URL}/project/${projectName}`
                        metaGraph = subject + '/default.meta'
                    } else {
                        subject = url
                        metaGraph = `${url}.meta`
                    }
                    break;
                default:
                    throw { reason: 'Could not find the meta graph', status: 500 }
            }

            const aclGraph = await findAclSparql(subject, metaGraph, projectName)
            resolve(aclGraph)
        } catch (error) {
            reject(error)
        }
    })
}

requestPermissions = (method, url, type) => {
    let permissions = []
    if (url.endsWith('.acl') || url.endsWith('.meta')) {
        permissions.push('acl:Control')
    } else {
        switch (method) {
            case 'GET':
            case 'HEAD':
                permissions.push('acl:Read')
                break;
            case 'PUT':
            case 'PATCH':
                permissions.push('acl:Append')
                permissions.push('acl:Read')
                break;
            case 'POST':
            case 'DELETE':
                permissions.push('acl:Write')
                permissions.push('acl:Read')
                if (type === 'PROJECT') {
                    permissions.push('acl:Control')
                }
                break;
            default:
                break;
        }
    }
    console.log('permissions', permissions)
    return permissions
}

queryPermissions = (user, acl, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
 PREFIX lbd: <https://lbdserver.com/vocabulary#>
 PREFIX acl: <http://www.w3.org/ns/auth/acl#>
 SELECT ?permission ?agent ?agentClass ?agentGroup
 FROM <${acl}>
 WHERE {
    {?rule acl:mode ?permission;
        acl:agent ?agent .}
UNION {?rule acl:mode ?permission;
        acl:agentClass ?agentClass .}
UNION {?rule acl:mode ?permission;
        acl:agentGroup ?agentGroup .}
}`
            query = query.replace(/\n/g, "")
            console.log('query', query)
            const results = await graphStore.queryRepository(project, encodeURIComponent(query))
            console.log('results.results.bindings[0]', results.results.bindings)
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

getType = (fullUrl, path) => {
    return new Promise((resolve, reject) => {
        let type
        urlParts = fullUrl.split('/')
        pathParts = path.split('/')
        if (urlParts[urlParts.length - 2] === 'project') {
            type = 'PROJECT'
        } else if (pathParts[pathParts.length - 2] === 'files') {
            type = 'FILE'
        } else if (pathParts[pathParts.length - 1] === 'graphs') {
            type = 'GRAPH'
        } else {
            reject({ reason: 'Could not determine the requested resource type', status: 500 })
        }
        resolve(type)
    })
}



findAclSparql = (subject, meta, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
PREFIX lbd: <https://lbdserver.com/vocabulary#>
 SELECT ?acl 
 FROM <${meta}>
 WHERE {
    <${subject}> lbd:hasAcl ?acl .
            }
            `
            query = query.replace(/\n/g, "")
            const results = await graphStore.queryRepository(project, encodeURIComponent(query))
            resolve(results.results.bindings[0].acl.value)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { checkPermissions }