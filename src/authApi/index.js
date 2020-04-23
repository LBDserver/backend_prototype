const {authenticate} = require('./authenticate')
const { register, login, logout, deleteProfile, getUser, getUsers, updateProfile } = require('./account')

module.exports = {
    register,
    login,
    logout,
    deleteProfile,
    getUser,
    getUsers,
    updateProfile,
    authenticate
}