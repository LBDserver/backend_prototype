const express = require('express');
const router = express.Router();

const {
    register,
    login,
    logout,
    deleteProfile,
    getUser,
    getUsers,
    updateProfile,
    authenticate,
    authenticateAdmin,
    getUserById,
    checkAccess,
    migrateUrls
} = require('../authApi')

router.get('/', (req, res) => {
    return res.status(200).send('Welcome to the home page of the LBDserver API')
})

// auth routes
router.post('/register', register)
router.post('/login', login)
router.post('/logout', authenticate, logout)

// change to webID-based routes
router.get('/:userName', authenticate, checkAccess, getUser)
router.post('/:userName', authenticate, updateProfile)
router.put('/:userName', authenticate, updateProfile)
router.patch('/:userName', authenticate, updateProfile)
router.delete('/:userName', authenticate, deleteProfile)

// requires admin privileges
router.get('/users', authenticateAdmin, getUsers)
router.get('/migrate', authenticateAdmin, migrateUrls) // in case of migration to another uri (e.g. from dev to production)


module.exports = router;