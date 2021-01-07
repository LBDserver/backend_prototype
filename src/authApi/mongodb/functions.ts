import { IRegisterRequest, IReturnUser, IAuthRequest, ILoginRequest, IUser } from "../../interfaces/userInterface";
import User, { IUserDocument, IUserModel } from '../../projectApi/documentApi/mongodb/models/UserModel'
import * as jwt from 'jsonwebtoken'
import * as express from 'express'
import { basicPermissions } from '../authorisation/basicPermissions'

async function register(props: IRegisterRequest): Promise<IReturnUser> {
    try {
        const user: IUserDocument = new User({ ...props, uri: `${process.env.DOMAIN_URL}/${props.username}` })
        await user.save()
        const token = await user.generateAuthToken()
        return { user, token }
    } catch (error) {
        throw new Error(`Unable to register user; ${error.message}`)
    }
}

async function login(props: ILoginRequest): Promise<IReturnUser> {
    try {
        const user: IUserDocument = await User.findByCredentials(props.email, props.password)
        const token = await user.generateAuthToken()
        return { user, token }
    } catch (error) {
        throw new Error(`Unable to login user; ${error.message}`)
    }
}

async function authenticate(req: express.Request): Promise<IAuthRequest> {
    try {
        if (req.header("Authorization")) {
            const token = req.header("Authorization").replace("Bearer ", "");
            console.log('token', token)
            const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET);
            console.log('decoded', decoded)
            const user: IUserDocument = await User.findOne({ _id: decoded._id });
            if (user.tokens.includes(token)) {
                const authReq: IAuthRequest = Object.assign(req, { user }, { token })
                return authReq
            } else {
                throw new Error('Token not found at associated user document')
            }
        } else {
            console.info("User is undefined; will be considered foaf:Agent")
            const authReq: IAuthRequest = Object.assign(req, { user: undefined }, { token: undefined })
            return authReq
        }
    } catch (error) {
        throw new Error(`Unable to authenticate; ${error.message}`)
    }
}

async function logout(req: IAuthRequest): Promise<void> {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token !== req.token
        })
        await req.user.save()
    } catch (error) {
        throw new Error(`Unable to logout; ${error.message}`)
    }
}

export default {
    register,
    login,
    authenticate,
    logout
}