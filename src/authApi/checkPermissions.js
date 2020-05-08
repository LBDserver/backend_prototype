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
            const { acl, owners } = await getAcl(req, url, type)
            const permissions = await queryPermissions(req.user.url, acl, projectName, owners)
            const allowed = requestedPermissions.some(r => permissions.has(r))
            if (allowed) {
                resolve()
            } else {
                reject({ reason: "Operation not permitted: unauthorized", status: "401" })
            }
        } catch (error) {
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

            const { acl, owners } = await findAclSparql(subject, metaGraph, projectName)
            resolve({ acl, owners })

        } catch (error) {
            reject(error)
        }
    })
}

requestPermissions = (method, url, type) => {
    let permissions = []
    if (url.endsWith('.acl') || url.endsWith('.meta')) {
        permissions.push('http://www.w3.org/ns/auth/acl#Control')
    } else {
        switch (method) {
            case 'GET':
            case 'HEAD':
                permissions.push('http://www.w3.org/ns/auth/acl#Read')
                break;
            case 'PUT':
            case 'PATCH':
                permissions.push('http://www.w3.org/ns/auth/acl#Append')
                permissions.push('http://www.w3.org/ns/auth/acl#Read')
                break;
            case 'POST':
            case 'DELETE':
                permissions.push('http://www.w3.org/ns/auth/acl#Write')
                permissions.push('http://www.w3.org/ns/auth/acl#Read')
                if (type === 'PROJECT') {
                    permissions.push('http://www.w3.org/ns/auth/acl#Control')
                }
                break;
            default:
                break;
        }
    }
    return permissions
}

queryPermissions = (user, acl, project, owners) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
 PREFIX lbd: <https://lbdserver.com/vocabulary#>
 PREFIX acl: <http://www.w3.org/ns/auth/acl#>
 SELECT ?permission ?agent ?rel
 FROM <${acl}>
 WHERE {
    {?rule acl:mode ?permission;
        acl:agent ?agent .
        BIND (acl:agent AS ?rel)
    }
UNION {?rule acl:mode ?permission;
        acl:agentClass ?agent .
        BIND (acl:agentClass AS ?rel)
    }
UNION {?rule acl:mode ?permission;
        acl:agentGroup ?agent .
        BIND (acl:agentGroup AS ?rel)
    }
}`
            query = query.replace(/\n/g, "")
            const results = await graphStore.queryRepository(project, encodeURIComponent(query))

            let allowedModes = new Set()

            for await (item of results.results.bindings) {
                {
                    if (item.rel.value === "http://www.w3.org/ns/auth/acl#agent" && item.agent.value == user) {
                        allowedModes.add(item.permission.value)
                    } else if (item.rel.value === "http://www.w3.org/ns/auth/acl#agentClass") {
                        if (item.agent.value === "https://lbdserver.com/vocabulary#Owner" && owners.includes(user)) {
                            allowedModes.add(item.permission.value)
                        } else if (item.agent.value === "https://lbdserver.com/vocabulary#Agent" || item.agent.value === "http://www.w3.org/ns/auth/acl#AuthenticatedAgent") {
                            allowedModes.add(item.permission.value)
                        }
                    } else if (item.rel.value === "http://www.w3.org/ns/auth/acl#agentGroup") {
                        console.log('item.rel.value', item.rel.value)
                        const groupMembers = await findGroupMembers(item.agent.value, project)
                        if (groupMembers.includes(user)) {
                            allowedModes.add(item.permission.value)
                        }
                    }
                }
            }

            resolve(allowedModes)
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

// agent groups are local here
findGroupMembers = (groupUri, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = `
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
 select ?member
 where {
     <${groupUri}> vcard:hasMember ?member
}`
            let groupMembers = []
            const results = await graphStore.queryRepository(project, encodeURIComponent(query))
            results.results.bindings.forEach(item => {
                groupMembers.push(item.member.value)
            })
            resolve(groupMembers)
        } catch (error) {
            reject(error)
        }
    })
}

findAclSparql = (subject, meta, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            let aclQuery = `
PREFIX lbd: <https://lbdserver.com/vocabulary#>
 SELECT ?acl
 FROM <${meta}>
 WHERE {
    <${subject}> lbd:hasAcl ?acl.
 }`

            let ownerQuery = `
PREFIX lbd: <https://lbdserver.com/vocabulary#>
 SELECT ?owner
 FROM <${meta}>
 WHERE {
 <${subject}> lbd:hasOwner ?owner .
 }`

            aclQuery = aclQuery.replace(/\n/g, " ")
            const aclResults = await graphStore.queryRepository(project, encodeURIComponent(aclQuery))
            const ownerResults = await graphStore.queryRepository(project, encodeURIComponent(ownerQuery))
            console.log('aclResults', aclResults)
            console.log('ownerResults', ownerResults)
            let owners = []
            ownerResults.results.bindings.forEach(item => {
                owners.push(item.owner.value)
            })

            resolve({ acl: aclResults.results.bindings[0].acl.value, owners })
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { checkPermissions }