function createDCATProjectMeta(
  projectURI,
  projectTitle,
  description,
  acl,
  creatorURI
) {
  const template = `
@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
@prefix lbd: <https://lbdserver.org/vocabulary#>. 
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.

<${projectURI}>
  a dcat:Catalog ;
  dct:title "${projectTitle}"@en ;
  rdfs:label "${projectTitle}"@en ;
  rdfs:comment "${description}"@en ;
  lbd:hasAcl <${acl}> ;
  dct:publisher <${creatorURI}> .
`;
  return template;
}

function createDCATResourceMeta(datasetURI, acl, datasetTitle, description, creatorURI) {
  const now = new Date();

  const template = `
@prefix acl: <http://www.w3.org/ns/auth/acl#>. 
@prefix lbd: <https://lbdserver.org/vocabulary#>. 
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>. 
@prefix dcat: <http://www.w3.org/ns/dcat#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<${datasetURI}.meta>
    a dcat:Dataset ;
    lbd:hasAcl <${acl}> ;
    rdfs:comment "${description}"@en ;
    rdfs:label "${datasetTitle}"@en ;
    dct:title "${datasetTitle}"@en ;
    dct:creator <${creatorURI}> ;
    dct:issued "${now.toISOString()}"^^xsd:date ;
    dct:modified "${now.toISOString()}"^^xsd:date ;
    dct:publisher <${creatorURI}> ;
    dcat:distribution <${datasetURI}> .`;

  return template;
}

module.exports = {
  createDCATProjectMeta,
  createDCATResourceMeta,
};
