const { model } = require('mongoose')
const { User, Project, File } = require("../../projectApi/documentApi/mongodb/models")
const graphStore = require('../../projectApi/graphApi/graphdb')
const { translate, toSparql } = require('sparqlalgebrajs');
const _ = require('lodash')

basicPermissions = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const projectName = req.params.projectName
            const url = `${process.env.DOMAIN_URL}${req.baseUrl}${req.path}`

            // determines the type of the request => project, graph, file, query
            const type = getType(url, req)

            // determines the permissions that are asked by the agent
            const requestedPermissions = requestPermissions(req.method, url, type)

            let allowed, permissions
            console.log('req.query.query', req.query.query) 
           
            if (req.query.query && type === "PROJECT") {
                let allowedGraphs = []
                let graphsToCheck = await allGraphs(req, projectName)

                for await (graph of graphsToCheck) {
                    let metaGraph
                    if (graph.endsWith('.meta')) {
                        metaGraph = graph
                    } else {
                        metaGraph = graph + '.meta'
                    }

                    const acl = await findAclSparql(graph, metaGraph, projectName)
                    permissions = await queryPermissions(req.user, acl, projectName)

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
                    const newQuery = await adaptQuery(sparql, allowedGraphs)
                    resolve({allowed, query: newQuery, permissions: ['http://www.w3.org/ns/auth/acl#Read']})
                } else {
                    resolve({allowed})
                }

                // default case (also when resource is ACL file (ends with .acl))
            } else {
                const acl = await getAcl(req, url, type)
                permissions = await queryPermissions(req.user, acl, projectName)

                                // see if all requested permissions are present in the actual permitted operations
                allowed = requestedPermissions.some(r => permissions.has(r))
            }

            if (allowed) {
                resolve({allowed, permissions})
            } else {
                reject({ reason: "Operation not permitted: unauthorized", status: "401" })
            }
        } catch (error) {
            reject(error)
        }
    })
}

getType = (fullUrl, req) => {
    let type
    const path = req.path
    urlParts = fullUrl.split('/')
    pathParts = path.split('/')
    if (pathParts[pathParts.length - 2] === 'files') {
        type = 'FILE'
    // } else if (req.query.query) {
    //     type = 'QUERY'
    } else if (pathParts[pathParts.length - 2] === 'graphs' || pathParts[pathParts.length - 1] === 'graphs') {
        type = 'GRAPH'
    } else {
        type = 'PROJECT'
    }
    return type
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

adaptQuery = (query, graphs) => {
    return new Promise((resolve, reject) => {
        try {
            const algebra = translate(query)
            console.log('algebra', algebra)

            let splitQuery = query.split('where')
            if (splitQuery.length <= 1) {
                splitQuery = query.split('WHERE')
            }
            graphs.forEach(graph => {
                splitQuery[0] = splitQuery[0] + `FROM <${graph}> `
            })

            const newQuery = splitQuery[0] + "WHERE" + splitQuery[1]
            console.log('newQuery', newQuery)
            resolve(newQuery)
        } catch (error) {
            reject(error)
        }
    })
}

allGraphs = (request, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            let sparql
            if (request.method === 'GET') { sparql = request.query.query }
            //else if (request.method === 'POST') { sparql = request.query.update }

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
            console.log('projectName', projectName)


            switch (type) {
                case 'PROJECT':
                    subject = `${process.env.DOMAIN_URL}/lbd/${projectName}.meta`
                    metaGraph = `${process.env.DOMAIN_URL}/lbd/${projectName}.meta`
                    break;
                case 'GRAPH':
                    const graphId = req.params.graphId
                    const graph = process.env.DOMAIN_URL + '/lbd/' + projectName + '/graphs/' + graphId
                    if (req.method == 'POST') {
                        subject = `${process.env.DOMAIN_URL}/lbd/${projectName}`
                        metaGraph = subject + '.meta'
                    } else {
                        subject = graph
                        metaGraph = `${graph}.meta`
                    }
                    break;
                case 'FILE':
                    if (req.method == 'POST') {
                        subject = `${process.env.DOMAIN_URL}/lbd/${projectName}`
                        metaGraph = subject + '.meta'
                    } else {
                        subject = url
                        metaGraph = `${url}.meta`
                    }
                    break;
                default:
                    throw { reason: 'Could not find the meta graph', status: 500 }
            }

            const acl = await findAclSparql(subject, metaGraph, projectName)
            resolve(acl)

        } catch (error) {
            reject(error)
        }
    })
}

queryPermissions = (user, acl, project) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. query for agents or their e-mail
            let agentQuery = `
            PREFIX lbd: <https://lbdserver.org/vocabulary#>
            PREFIX acl: <http://www.w3.org/ns/auth/acl#>
            PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
            
            SELECT ?permission ?agent ?email
            FROM <${acl}>
            WHERE 
                {?rule acl:mode ?permission;
                    acl:agent ?agent .
            
                    ?agent vcard:email ?email
            }
            `
            agentQuery = agentQuery.replace(/\n/g, "")
            let allowedModes = new Set()

            const agentResults = await graphStore.queryRepository(project, encodeURIComponent(agentQuery))
            for await (item of agentResults.results.bindings) {
                if (item.agent.value === user.url || item.agent.email === user.email) {
                    allowedModes.add(item.permission.value)
                }
            }

            // 2. query for agentClasses (e.g. every agent)
            let agentClassQuery = `
            PREFIX lbd: <https://lbdserver.org/vocabulary#>
            PREFIX acl: <http://www.w3.org/ns/auth/acl#>
            PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
            
            SELECT ?permission ?agent ?email
            FROM <${acl}>
            WHERE 
                {?rule acl:mode ?permission;
                    acl:agentClass ?agent
            }
            `
            agentClassQuery = agentClassQuery.replace(/\n/g, "")

            const agentClassResults = await graphStore.queryRepository(project, encodeURIComponent(agentQuery))
            for await (item of agentClassResults.results.bindings) {
                if (item.agent.value === "http://xmlns.com/foaf/0.1/Agent") {
                    allowedModes.add(item.permission.value)
                }
            }

            // 3. query for agentGroups



            // for await (item of results.results.bindings) {
            //     {
            //         if (item.rel.value === "http://www.w3.org/ns/auth/acl#agent" && item.agent.value == user.url) {
            //             allowedModes.add(item.permission.value)
            //         } else if (item.rel.value === "http://www.w3.org/ns/auth/acl#agentClass") {
            //             if (item.agent.value === "https://lbdserver.org/vocabulary#Owner" && owners.includes(user.url)) {
            //                 allowedModes.add(item.permission.value)
            //             } else if (item.agent.value === "https://lbdserver.org/vocabulary#Agent" || item.agent.value === "http://www.w3.org/ns/auth/acl#AuthenticatedAgent") {
            //                 allowedModes.add(item.permission.value)
            //             }
            //         } else if (item.rel.value === "http://www.w3.org/ns/auth/acl#agentGroup") {
            //             const groupMembers = await findGroupMembers(item.agent.value, project)
            //             if (groupMembers.includes(user)) {
            //                 allowedModes.add(item.permission.value)
            //             }
            //         }
            //     }
            // }
            resolve(allowedModes)
        } catch (error) {
            reject(error)
        }
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
            console.log('meta', meta)

            let aclQuery = `
PREFIX lbd: <https://lbdserver.org/vocabulary#>
 SELECT ?acl ?s
 FROM <${meta}>
 WHERE {
    ?s lbd:hasAcl ?acl.
 }`

            let acl
            if (!subject.endsWith('.acl')) {
                aclQuery = aclQuery.replace(/\n/g, " ")
                const aclResults = await graphStore.queryRepository(project, encodeURIComponent(aclQuery))
                acl = aclResults.results.bindings[0].acl.value

            } else {
                acl = subject
            }

            resolve(acl)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { basicPermissions, adaptQuery }