const jwt = require('jsonwebtoken')
const User = require('../projectApi/documentApi/mongodb/models/UserModel')


authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'dskdkdkhddovjsfdqs3654fqs3d8fqsdq534vs6dqf')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()

    } catch (error) {
        res.status(401).send({error: 'Please authenticate'})
    }
}

authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'dskdkdkhddovjsfdqs3654fqs3d8fqsdq534vs6dqf')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }

        if (user.email === 'jeroen.werbrouck@hotmail.com') {
            req.user = user
            req.token = token
            next()
        } else {
            throw new Error()
        }

    } catch (error) {
        res.status(401).send({error: 'Admin rights are required to access this endpoint'})
    }
}

module.exports = { authenticate, authenticateAdmin }