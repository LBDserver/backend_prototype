const { v4 } = require('uuid');

namedGraphMeta = (namedGraph, acl, creator, title, id, description) => {
    const ownerBlankNode = v4()
    let data =  `@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
    @prefix lbd: <https://lbdserver.com/vocabulary#>. 
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
    @prefix vcard: <http://www.w3.org/2006/vcard/ns#>.

    @prefix : <./>. 
    <${namedGraph}> lbd:hasAcl <${acl}>;
        lbd:hasOwner _:${ownerBlankNode};
        rdfs:comment "${description}";
        dcterms:title "${title}";
        rdfs:label "${id}".

    _:${ownerBlankNode} vcard:email "${creator.email}".
    `

    data = data.replace(/\n/g, "")
    return data
}

aclMeta = (aclUrl, owner) => {
    let data =  `@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
    @prefix lbd: <https://lbdserver.com/vocabulary#>. 
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
    @prefix : <./>. 
    <${aclUrl}> lbd:hasOwner <${owner}>;
        lbd:isAcl "true".
    `

    data = data.replace(/\n/g, "")
    return data
}

module.exports = {namedGraphMeta, aclMeta}