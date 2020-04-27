const { v4 } = require('uuid')

exports.namedGraphMeta = function (namedGraph, acl, owner) {
    return `#
    # ACL reference
    @prefix acl: <http://www.w3.org/ns/auth/acl#>.
    @prefix lbd: <https://lbdserver.com/vocabulary#>.
    @prefix : <./>.

    ${namedGraph} lbd:hasAcl ${acl};
        lbd:hasOwner ${owner}.
`
}