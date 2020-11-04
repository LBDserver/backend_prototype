const { v4 } = require('uuid');

namedGraphMeta = (namedGraph, acl, title, id, description) => {
    const ownerBlankNode = v4()
    let data =  `@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
    @prefix lbd: <https://lbdserver.org/vocabulary#>. 
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
    @prefix vcard: <http://www.w3.org/2006/vcard/ns#>.

    @prefix : <./>. 
    <${namedGraph}> lbd:hasAcl <${acl}>;
        rdfs:comment "${description}";
        dcterms:title "${title}";
        rdfs:label "${id}".
    `

    data = data.replace(/\n/g, "")
    return data
}

aclMeta = (aclUrl, owner) => {
    let data =  `@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
    @prefix lbd: <https://lbdserver.org/vocabulary#>. 
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
    @prefix : <./>. 
    <${aclUrl}> lbd:hasOwner <${owner}>;
        lbd:isAcl "true".
    `

    data = data.replace(/\n/g, "")
    return data
}

module.exports = {namedGraphMeta, aclMeta}