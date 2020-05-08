const jwt = require('jsonwebtoken')
const { checkPermissions } = require('./checkPermissions')
const User = require('../projectApi/documentApi/mongodb/models/UserModel')
const Project = require('../projectApi/documentApi/mongodb/models/ProjectModel')


authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()

    } catch (error) {
        res.status(401).send({ error: 'Please authenticate' })
    }
}

authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }

        if (user.email === 'admin@lbdserver.com') {
            req.user = user
            req.token = token
            next()
        } else {
            throw new Error()
        }

    } catch (error) {
        res.status(401).send({ error: 'Admin rights are required to access this endpoint' })
    }
}

checkAccess = async (req, res, next) => {
    try {
        const accessPermitted = await checkPermissions(req)
        next()
    } catch (error) {
        try {
            return res.status(error.status).send({ error: error.reason })
        } catch (err) {
            console.log('err', err)
            return res.status(500).send({ error: error.message })
        }
    }
}


module.exports = { authenticate, authenticateAdmin, checkAccess }