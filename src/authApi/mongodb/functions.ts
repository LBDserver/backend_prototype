import { IRegisterRequest, IReturnUser, IAuthRequest, ILoginRequest, IUser } from "../../interfaces/userInterface";
import User, {IUserDocument, IUserModel} from '../../projectApi/documentApi/mongodb/models/UserModel'
import * as jwt from 'jsonwebtoken'
import * as express from 'express'

async function register(props: IRegisterRequest): Promise<IReturnUser> {
    return new Promise(async (resolve, reject) => {
        try {
            const user: IUserDocument = new User({ ...props })
            await user.save()
            const token = await user.generateAuthToken()
            resolve({ user, token })
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

async function login(props: ILoginRequest): Promise<IReturnUser> {
    return new Promise(async (resolve, reject) => {
        try {
            const user: IUserDocument = await User.findByCredentials(props.email, props.password)
            const token = await user.generateAuthToken()
            resolve({ user, token })
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

async function authenticate(req: express.Request): Promise<IAuthRequest> {
    return new Promise(async (resolve, reject) => {
        try {
            if (req.header("Authorization")) {
                const token = req.header("Authorization").replace("Bearer ", "");
                console.log('token', token)
                const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET);
                console.log('decoded', decoded)
                const user: IUserDocument = await User.findOne({ _id: decoded._id});
                if (user.tokens.includes(token)) {
                    const authReq: IAuthRequest = Object.assign(req, {user}, {token})
                    resolve(authReq)
                } else {
                    throw new Error('Token not found at associated user document')
                }
            } else {
                console.log("no user")
                resolve(req)
            }
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

async function logout(req: IAuthRequest): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            req.user.tokens = req.user.tokens.filter((token) => {
                return token !== req.token
            })
            await req.user.save()
            resolve()
        } catch (error) {
            console.error('error', error)
            reject(error)
        }
    })
}

export default {
    register,
    login,
    authenticate,
    logout
}