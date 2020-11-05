const {
    createRepository,
    getRepositories,
    getRepository,
    deleteRepository
} = require('./repository-management-controller')

const {
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createUser
} = require('./security-management-controller')

module.exports = {
    createRepository,
    getRepositories,
    getRepository,
    deleteRepository,
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createUser
}