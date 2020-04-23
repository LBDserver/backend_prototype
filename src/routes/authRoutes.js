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
    authenticate
} = require('../authApi')

router.get('/', (req, res) => {
    return res.status(200).send('Welcome to the home page of the LBDserver API')
})

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)

router.get('/profile/me', authenticate, getUser)
router.post('/profile/me', authenticate, updateProfile)
router.put('/profile/me', authenticate, updateProfile)
router.delete('/profile/me', authenticate, deleteProfile)

module.exports = router;