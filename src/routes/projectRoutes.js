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
    getNamedGraph,
    deleteNamedGraph,
    updateNamedGraph,
    createNamedGraph,
    replaceNamedGraph
} = require('../projectApi')

const { authenticate } = require('../authApi')

const upload = multer({
    limits: {
        fileSize: 10000000
    }
})

router.get('/', authenticate, getAllProjects) // get a list of all projects owned by the current user (future: also projects to which the user is associated)
router.post('/', authenticate, createProject) // create a project repository and metadata

router.get('/:projectName', authenticate, getOneProject) // get project metadata
router.get('/:projectName/query', authenticate, queryProject) // only SPARQL select queries. Named graphs can be indicated
router.post('/:projectName/query', authenticate, queryProject) // all SPARQL queries. Named graphs can be indicated

// updating a project will not happen very often.
router.put('/:projectName', authenticate, updateProject) // update project metadata graph
router.patch('/:projectName', authenticate, updateProject) // idem
router.post('/:projectName', authenticate, updateProject) // idem
router.delete('/:projectName', authenticate, deleteProject) // delete a project

router.get('/:projectName/graphs', authenticate, getNamedGraph) // get single named graphs, as TTL
router.post('/:projectName/graphs', authenticate, createNamedGraph) // create a named graph by sending a TTL file

router.put('/:projectName/graphs', authenticate, replaceNamedGraph) // named graph will be replaced. In-graph updates should happen via sparql.
router.patch('/:projectName/graphs', authenticate, updateNamedGraph) // SPARQL UPDATE on a specific named graph
router.delete('/:projectName/graphs', authenticate, deleteNamedGraph) // delete named graph by referring to its URI

router.post('/:projectName/upload', authenticate, upload.single('file'), uploadDocumentToProject) // upload a document to the document store. Objects are be linked to the project metadata, but can be referenced in named graphs. 
router.get('/:projectName/files/:fileId/', authenticate, upload.single('file'), getDocumentFromProject) // get a document from the document store. 

module.exports = router;