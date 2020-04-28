namedGraphMeta = (namedGraph, acl, owner, name, description) => {
    let data =  `@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
    @prefix lbd: <https://lbdserver.com/vocabulary#>. 
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
    @prefix : <./>. 
    <${namedGraph}> lbd:hasAcl <${acl}>;
         lbd:hasOwner <${owner}>;
         rdfs:comment "${description}";
         rdfs:label "${name}".
    `

    data = data.replace(/\n/g, "")
    return data
}

aclMeta = (aclUrl, owner) => {
    let data =  `@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
    @prefix lbd: <https://lbdserver.com/vocabulary#>. 
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
    @prefix : <./>. 
    <${aclUrl}> lbd:hasOwner <${owner}>.
    `

    data = data.replace(/\n/g, "")
    return data
}

module.exports = {namedGraphMeta, aclMeta}