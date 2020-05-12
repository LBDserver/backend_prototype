const { model } = require('mongoose')
const { User, Project, File } = require("../projectApi/documentApi/mongodb/models")
const graphStore = require('../projectApi/graphApi/graphdb')
const _ = require('lodash')

checkPermissions = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const projectName = req.params.projectName
            const url = `${process.env.SERVER_URL}${req.originalUrl}`
            const type = await getType(url, req.path)

            const requestedPermissions = requestPermissions(req.method, url, type)

            let allowed, permissions
            // if type is query
            let allowedGraphs = []
            if (type === 'QUERY') {
                let graphsToCheck = await allGraphs(req, projectName)
                for await (graph of graphsToCheck) {
                    let metaGraph
                    if (graph.endsWith('.meta')) {
                        metaGraph = graph
                    } else {
                        metaGraph = graph + '.meta'
                    }

                    const { acl, owners } = await findAclSparql(graph, metaGraph, projectName)
                    permissions = await queryPermissions(req.user.url, acl, projectName, owners)

                    allowed = requestedPermissions.some(r => permissions.has(r))
                    if (allowed) {
                        allowedGraphs.push(graph)
                    }
                }
                let sparql
                if (req.method === 'GET') { sparql = req.query.query }
                else if (req.method === 'POST') { sparql = req.query.update }

                queryNotChanged = graphsToCheck.some(r => allowedGraphs.includes(r))

                if (!queryNotChanged) {
                    reject({ reason: 'You do not have permission to query all these graphs. Please consider to be more specific or only include graphs that you have access to.', status: 401 })
                } else {
                    resolve(allowed)
                }

                // default case (also when resource is ACL file (ends with .acl))
            } else {
                const { acl, owners } = await getAcl(req, url, type)
                permissions = await queryPermissions(req.user.url, acl, projectName, owners)

                allowed = requestedPermissions.some(r => permissions.has(r))
            }

            if (allowed) {
                resolve(allowed)
            } else {
                reject({ reason: "Operation not permitted: unauthorized", status: "401" })
            }

        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// adaptQuery = (query, graphs) => {
//     return new Promise((resolve, reject) => {
//         try {
//             console.log('query', query)
//             console.log('graph', graph)
//             let newQuery = query.split('where')
//             console.log('newQuery', newQuery)
//             resolve(newQuery)

//         } catch (error) {
//             reject()

//         }
//     })
// }

allGraphs = (request, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            let sparql
            if (request.method === 'GET') { sparql = request.query.query }
            else if (request.method === 'POST') { sparql = request.query.update }

            let namedGraphs = []
            let queriedGraphs = []
            // get a list of the named graphs in the repository
            const allNamed = await graphStore.getAllNamedGraphs(project, '')
            allNamed.results.bindings.forEach(result => {
                const value = `<${result.contextID.value}>`
                const realValue = result.contextID.value
                // unless indicated in the request, acl and meta files are ignored
                if (value.endsWith('acl>') && Object.keys(request.query).includes('acl') && request.query.acl === 'true') {
                    namedGraphs.push(realValue)
                    if (sparql.includes(value)) {
                        queriedGraphs.push(realValue)
                    }
                } else if (value.endsWith('meta>') && Object.keys(request.query).includes('meta') && request.query.meta === 'true') {
                    namedGraphs.push(realValue)
                    if (sparql.includes(value)) {
                        queriedGraphs.push(realValue)
                    }
                } else if (!value.endsWith('meta>') && !value.endsWith('acl>')) {
                    namedGraphs.push(realValue)
                    if (sparql.includes(value)) {
                        queriedGraphs.push(realValue)
                    }
                }
            })

            // if no graphs are mentioned, all graphs are to be queried
            if (!queriedGraphs.length) {
                queriedGraphs = namedGraphs
            }

            resolve(queriedGraphs)

        } catch (error) {
            reject(error)
        }
    })
}

// restructure, do not pass req as a parameter!
getAcl = (req, url, type) => {
    return new Promise(async (resolve, reject) => {
        try {

            let metaGraph, subject
            const projectName = req.params.projectName
            const graph = req.query.graph

            switch (type) {
                case 'PROJECT':
                    subject = url
                    metaGraph = `${url}.meta`
                    break;
                case 'GRAPH':
                    if (req.method == 'POST') {
                        subject = `${process.env.SERVER_URL}/project/${projectName}`
                        metaGraph = subject + '.meta'
                    } else {
                        subject = graph
                        metaGraph = `${graph}.meta`
                    }
                    break;
                case 'FILE':
                    if (req.method == 'POST') {
                        subject = `${process.env.SERVER_URL}/project/${projectName}`
                        metaGraph = subject + '.meta'
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
        } else if (pathParts[pathParts.length - 1] === 'query') {
            type = 'QUERY'
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
            if (subject.endsWith('meta')) {
                meta = subject
            }

            let aclQuery = `
PREFIX lbd: <https://lbdserver.com/vocabulary#>
 SELECT ?acl ?s
 FROM <${meta}>
 WHERE {
    ?s lbd:hasAcl ?acl.
 }`

            let ownerQuery = `
PREFIX lbd: <https://lbdserver.com/vocabulary#>
 SELECT ?owner ?s
 FROM <${meta}>
 WHERE {
 ?s lbd:hasOwner ?owner .
 }`
            let acl, owners
            if (!subject.endsWith('.acl')) {
                aclQuery = aclQuery.replace(/\n/g, " ")
                const aclResults = await graphStore.queryRepository(project, encodeURIComponent(aclQuery))
                acl = aclResults.results.bindings[0].acl.value
            } else {
                acl = subject
            }

            const ownerResults = await graphStore.queryRepository(project, encodeURIComponent(ownerQuery))
            owners = []
            ownerResults.results.bindings.forEach(item => {
                owners.push(item.owner.value)
            })

            resolve({ acl, owners })
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { checkPermissions }