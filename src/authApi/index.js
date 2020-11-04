const {authenticate, authenticateAdmin, checkAccess} = require('./authenticateApi')
const { register, login, logout, deleteProfile, getUser, updateProfile, logoutAll } = require('./userApi')
const { getUsers, getUserById, migrateUrls} = require('./adminApi')
const {checkPermissions} = require('./authorisation/checkPermissions')

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
    getUserById,
    migrateUrls,
    checkPermissions,
    checkAccess
}