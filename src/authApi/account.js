const User = require('../projectApi/documentApi/mongodb/models/UserModel')

register = async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        res.status(201).send(user)
    } catch (error) {
        console.log('error', error)
        res.status(400).send(error)
    }
}

login = async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        res.send(user)
    } catch (error) {
        console.log('error', error)
        res.status(400).send({error})
    }
}

logout = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'email', 'password', 'age']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation) {
            return res.status(404).send({ error: 'Invalid updates!' })
        }

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(400).send('User not found')
        }

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()


        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
}

getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(400).send('User not found')
        }
        res.send(user)
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

deleteProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) {
            return res.status(400).send('User not found')
        }
        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
}

module.exports = { register, login, logout, deleteProfile, getUser, getUsers, updateProfile }