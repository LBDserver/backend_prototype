const express = require('express');
const router = express.Router();

const {
    getProfileInfo,
    updateProfileInfo,
    deleteProfile,
    register,
    login,
    authenticate
} = require('../authApi')

router.get('/', (req, res) => {
    return res.status(200).send('Welcome to the home page of the LBDserver API')
})

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)

router.get('/profile/me', authenticate, getProfileInfo)
router.post('/profile/me', authenticate, updateProfileInfo)
router.put('/profile/me', authenticate, updateProfileInfo)
router.delete('/profile/me', authenticate, deleteProfile)

module.exports = router;