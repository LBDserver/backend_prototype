const request = require('request');
const defaultBody = require('../util/createGraphBody')

createNamedGraph = (repositoryId, { name, context, baseURI, data }, token) => {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(defaultBody(name, context, baseURI, data))

        try {
            var options = {
                'method': 'POST',
                'url': `http://localhost:7200/rest/data/import/upload/${repositoryId}/text`,
                'headers': {
                    'Content-Type': ['application/json', 'text/plain'],
                    'Authorization': `Bearer ${token}`
                },
                body: body
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getNamedGraph = (namedGraph, repositoryId, token, format) => {
    return new Promise((resolve, reject) => {
        try {
            const mimeTypes = {
                "turtle": "text/turtle"
            }

            const mimeType = mimeTypes[format]

            var options = {
                'method': 'GET',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs/service?graph=${namedGraph}\n`,
                'headers': {
                    'Accept': `${mimeType}`,
                    'Authorization': `Bearer ${token}`
                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

deleteNamedGraph = (namedGraph, repositoryId, token) => {
    return new Promise((resolve, reject) => {
        try {
            var options = {
                'method': 'POST',
                'url': `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/statements`,
                'headers': {
                    'Authorization': `Bearer ${token}`
                },
                formData: {
                    'update': `CLEAR GRAPH <${namedGraph}>`
                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                resolve(response.body);
            });
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}


module.exports = {
    createNamedGraph,
    deleteNamedGraph,
    getNamedGraph
}