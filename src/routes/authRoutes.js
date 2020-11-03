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
router.post('/register', register) // create an account on this LBD server
router.post('/login', login) // login on the LBD server (JWT)
router.post('/logout', authenticate, logout) // logout

// change to webID-based routes
router.get('/:userName', authenticate, getUser) // get user account data. (cf. solid webid)
router.post('/:userName', authenticate, updateProfile) // update your user profile
router.put('/:userName', authenticate, updateProfile) // idem
router.patch('/:userName', authenticate, updateProfile) // idem
router.delete('/:userName', authenticate, deleteProfile) // delete your profile. Your project is deleted when all collaborators have dismissed this project.

// requires admin privileges
router.get('/users', authenticateAdmin, getUsers) // get all users
router.get('/migrate', authenticateAdmin, migrateUrls) // in case of migration to another uri (e.g. from dev to production)


module.exports = router;