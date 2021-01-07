import * as express from 'express'
import { IUserDocument } from '../projectApi/documentApi/mongodb/models/UserModel'



interface ILoginRequest {
    email: string,
    password: string
}

interface IReturnUser {
    user: IUser,
    token: string
}

interface IRegisterRequest extends ILoginRequest {
    username: string
}

interface IUser {
    username: string,
    email: string,
    password?: string,
    tokens: string[],
    projects: string[],
}

// when extending with other modules, integrate in the type by setting a |
interface IAuthRequest extends express.Request {
    user?: IUserDocument,
    token?: string
}

export {
    IUser,
    IRegisterRequest,
    ILoginRequest,
    IReturnUser,
    IAuthRequest
}