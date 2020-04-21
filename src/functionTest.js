const  f = require('./projectApi/graphApi/graphdb')

const update = 'PREFIX n0: <http://xmlns.com/foaf/0.1/> DELETE DATA { <file:/uploaded/generated/card$.ttl%23me> n0:name "Jeroen Maurits Werbrouck"}; INSERT DATA { <file:/uploaded/generated/card$.ttl%23me> n0:name "Jeroen Werbrouck"}'

f.updateRepositorySparql('stupid', update)
    .then(value => {
        console.log('value', value.status)
    })
    .catch(error => console.log('error', error))
