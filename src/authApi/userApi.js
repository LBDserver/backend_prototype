const User = require('../projectApi/documentApi/mongodb/models/UserModel')

register = async (req, res) => {
    try {
        const user = new User({...req.body, url: `${process.env.DOMAIN_URL}/${req.body.username}`})
        
        // the user's webId should be validated if one is given! otherwise false. If no webId is given, the user gets a webId from the server.

        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        console.log('error', error)
        res.status(400).send(error)
    }
}

login = async (req, res) => {
    try {
        const {email, password} = decryptAuth(req.headers.authorization)
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        console.log('error', error)
        res.status(400).send({ error: error.toString() })
    }
}

decryptAuth = (base) => {
    try {
        const basic = base.split(' ')
        console.log('basic', basic)
        const [email, password] = Buffer.from(basic[1], 'base64').toString('ascii').split(':')
        return {email, password}
    } catch (error) {
        console.log('error', error)
        throw {reason: 'invalid username/password pair', status: 400}
    }
}

logout = async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()

    } catch (error) {
        res.staus(500).send()
    }
}

logoutAll = async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.staus(500).send()
    }
}

updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'email', 'password', 'webId']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation) {
            return res.status(404).send({ error: 'Invalid updates!' })
        }

        const user = req.user
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        res.send(user)
    } catch (error) {
        res.status(400).send(error)
    }
}

getUser = async (req, res) => {
    try {
        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
}

deleteProfile = async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
}

module.exports = { register, login, logout, logoutAll, deleteProfile, getUser, updateProfile }