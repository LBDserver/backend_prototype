const express = require('express');
const router = express.Router();

const {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    getProjectConfig
} = require('../projectApi')

const { authenticate } = require('../authApi')

router.get('/', authenticate, getAllProjects)
router.post('/', authenticate, createProject)

router.get('/:projectId', authenticate, getOneProject)
router.get('/:projectId/query', authenticate, queryProject)

router.put('/:projectId', authenticate, getProjectConfig, updateProject)
router.post('/:projectId', authenticate, getProjectConfig, updateProject)
router.delete('/:projectId', authenticate, deleteProject)

module.exports = router;