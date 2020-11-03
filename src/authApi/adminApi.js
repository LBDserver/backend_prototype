const File = require('../projectApi/documentApi/mongodb/models/FileModel')
const Project = require('../projectApi/documentApi/mongodb/models/ProjectModel')
const {migrateMongo} = require('../projectApi/documentApi/mongodb/')

getUserById = async (req, res) => {
    try {
        const _id = req.params.id
        const user = User.findById({ _id })
        if (!user) {
            res.status(404).send({ error: 'user not found' })
        }
        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
}

getUsers = async (req, res) => {
    try {
        const users = await User.find({})
        if (!users) {
            return res.status(400).send('No users found')
        }
        res.send(users)
    } catch (error) {
        res.status(400).send(error)
    }
}

// only mongo Urls at the moment. GraphDB does not change yet.
migrateUrls = async (req, res) => {
    try {
        const newBaseUri = req.body.url
        await migrateMongo(newBaseUri)
        res.status(201).send({message: 'success'})
    } catch (error) {
        res.status(500).send(error)
    }
}

module.exports = { getUserById, getUsers, migrateUrls }