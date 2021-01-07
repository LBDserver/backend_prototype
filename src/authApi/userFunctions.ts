import * as express from 'express'
import { IReturnUser, IAuthRequest } from '../interfaces/userInterface'
import authModule from './mongodb/functions'
import { basicPermissions } from './authorisation/basicPermissions'

async function createUser(req: express.Request): Promise<IReturnUser> {
    const { user, token } = await authModule.register({ ...req.body })
    return { user, token }
}

async function loginUser(req: express.Request): Promise<IReturnUser> {
    const { email, password } = decryptAuth(req.headers.authorization)
    const { user, token } = await authModule.login({ email, password })
    return { user, token }
}

async function logoutUser(req: IAuthRequest): Promise<void> {
    await authModule.logout(req)
    return
}

async function authenticate(req: express.Request): Promise<IAuthRequest> {
    const authRequest = await authModule.authenticate(req)
    return authRequest
}


async function authorize(req: IAuthRequest): Promise<IAuthRequest> {
    try {
        console.info("Checking access")
        const { allowed, query, permissions } = await basicPermissions(req)

        // adapt query (e.g. when an entire project is queried, only query the graphs to which read access is granted)
        if (req.query.query && query) {
            req.query.query = query;
        }

        req.permissions = permissions
        console.log('permissions', permissions)
        console.info(`Methods allowed: ${allowed}`)

        return req
    } catch (error) {
        throw new Error(`Error checking access; ${error.message}`)
    }
}

// helper function to decrypt basic auth Base64 
function decryptAuth(base) {
    try {
        const basic = base.split(' ')
        const [email, password] = Buffer.from(basic[1], 'base64').toString('ascii').split(':')
        return { email, password }
    } catch (error) {
        throw new Error('Unable to decrypt the basic Auth header')
    }
}

export {
    createUser,
    loginUser,
    logoutUser,
    authenticate,
    authorize
}