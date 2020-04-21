const {authenticate} = require('./authenticate')
const {register, login, logout, deleteProfile} = require('./account')
const {getProfileInfo, updateProfileInfo} = require('./profile')

module.exports = {
    getProfileInfo,
    updateProfileInfo,
    register,
    login,
    logout,
    deleteProfile,
    authenticate
}