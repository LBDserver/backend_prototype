const createGraphBody = require('./createGraphBody')
const {namedGraphMeta, aclMeta} = require('./namedGraphMeta')
const repoConfig = require('./repoConfig')
const {
    createDCATProjectMeta,
    createDCATResourceMeta
  } = require('./dcat/projectTemplate')

module.exports =  {
    createGraphBody,
    namedGraphMeta,
    repoConfig,
    aclMeta,
    createDCATProjectMeta,
    createDCATResourceMeta
}