import * as express from 'express'
import { IReturnUser, IAuthRequest } from '../interfaces/userInterface'
import authModule from './mongodb/functions'

async function createUser(req: express.Request): Promise<IReturnUser> {
    return new Promise(async (resolve, reject) => {
        try {
            const { user, token } = await authModule.register({ ...req.body })
            resolve({ user, token })
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

async function loginUser(req: express.Request): Promise<IReturnUser> {
    return new Promise(async (resolve, reject) => {
        try {
            // extract credentials
            const { email, password } = decryptAuth(req.headers.authorization)
            const { user, token } = await authModule.login({ email, password })
            resolve({ user, token })
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

async function logoutUser(req: IAuthRequest): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            authModule.logout(req)
            resolve()
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

async function authenticate(req: express.Request): Promise<IAuthRequest> {
    return new Promise(async (resolve, reject) => {
        try {
            const authRequest = await authModule.authenticate(req)
            resolve(authRequest)
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

// helper function to decrypt basic auth Base64 
function decryptAuth(base) {
    try {
        const basic = base.split(' ')
        const [email, password] = Buffer.from(basic[1], 'base64').toString('ascii').split(':')
        return { email, password }
    } catch (error) {
        console.log('error', error)
        throw { reason: 'invalid username/password pair', status: 400 }
    }
}

export {
    createUser,
    loginUser,
    logoutUser,
    authenticate
}