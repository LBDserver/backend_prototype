const express = require('express');
const router = express.Router();
const multer = require('multer')

const {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,

    uploadDocumentToProject,
    getDocumentFromProject,
    deleteDocumentFromProject,

    getNamedGraph,
    deleteNamedGraph,
    updateNamedGraph,
    createNamedGraph,
    replaceNamedGraph,
    queryNamedGraph,
    getPublicProjects
} = require('../projectApi')

const { authenticate, checkAccess } = require('../authApi')

const upload = multer({
    // limits: {
    //     fileSize: 10000000
    // }
})

router.get('/', authenticate, getAllProjects) // get a list of all projects owned by the current user (future: also projects to which the user is associated)
router.post('/', authenticate, createProject) // create a project repository and metadata

router.get('/public', getPublicProjects) // get project metadata

router.get('/:projectName', authenticate, checkAccess, getOneProject) // get project metadata
router.get('/:projectName', authenticate, checkAccess, getOneProject) // get project metadata
router.get('/:projectName/query', authenticate, checkAccess, queryProject) // only SPARQL select queries. Named graphs can be indicated
// router.post('/:projectName/query', authenticate, checkAccess, queryProject) // all SPARQL queries. Named graphs can be indicated

router.delete('/:projectName', authenticate, checkAccess, deleteProject) // delete a project

router.get('/:projectName/graphs/:graphId', authenticate, checkAccess, getNamedGraph) // get single named graphs, as TTL
router.post('/:projectName/graphs/:graphId', authenticate, checkAccess, updateNamedGraph) // update named graph
router.post('/:projectName/graphs', authenticate, checkAccess, upload.fields([{name: 'graph'}, {name: 'acl'}]), createNamedGraph) // create a named graph by sending a TTL file

router.patch('/:projectName/graphs/:graphId', authenticate, checkAccess, deleteNamedGraph) // SPARQL UPDATE on a specific named graph => use sparql update on /:projectName/query
router.delete('/:projectName/graphs/:graphId', authenticate, checkAccess, deleteNamedGraph) // delete named graph by referring to its URI

router.post('/:projectName/files', authenticate, checkAccess, upload.fields([{name: 'file'}, {name: 'acl'}]), uploadDocumentToProject) // upload a document to the document store. Objects are be linked to the project metadata, but can be referenced in named graphs. 
router.get('/:projectName/files/:fileId/', authenticate, checkAccess, getDocumentFromProject) // get a document from the document store. 
router.delete('/:projectName/files/:fileId/', authenticate, checkAccess, deleteDocumentFromProject) // get a document from the document store. 

module.exports = router;

