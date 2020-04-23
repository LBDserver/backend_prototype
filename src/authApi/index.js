const {authenticate, authenticateAdmin} = require('./authenticateApi')
const { register, login, logout, deleteProfile, getUser, getUsers, updateProfile, logoutAll, getUserById } = require('./accountApi')

module.exports = {
    register,
    login,
    logout,
    deleteProfile,
    getUser,
    getUsers,
    updateProfile,
    authenticate,
    logoutAll,
    authenticateAdmin,
    getUserById
}