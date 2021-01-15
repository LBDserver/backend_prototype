import { Controller, Example, Post, Route, SuccessResponse, TsoaResponse, Res, Body, Request, Header } from 'tsoa'
import { authenticate, createUser, loginUser, logoutUser } from '../authApi/userFunctions'
import { IUser, IRegisterRequest, IReturnUser } from 'lbd-server'
import {IAuthRequest} from '../interfaces/userInterface'
import * as express from 'express'

const userExample = {
    user: {
        username: "max",
        uri: "https://lbdserver.org/max",
        email: "max@mustermann.be",
        projects: [],
        tokens: []
    },
    token: "theBearerToken"
}

@Route('/register')
export class RegisterController extends Controller {

    /**
     * Register as a local user on the LBDserver. The body of the request contains a "username" field (used to create a WebID that can be used for Access Control purposes), an "email" field and a "password". 
     * @param req 
     * @param body 
     * @param serverErrorResponse 
     */
    @Example<IReturnUser>(userExample)
    @Post()
    public async register(
        @Request() req: express.Request,
        @Body() body: IRegisterRequest,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ) : Promise<IReturnUser> {
        try {
            const response = await createUser(req)
            this.setStatus(201)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }
}

/**
 * Login as an existing user on the local LBDserver. Login follows the Basic Auth protocol. The response is a token that should be used for authentication in all other LBDserver requests.
 */
@Route('/login')
export class LoginController extends Controller {
    @Example<IReturnUser>(userExample)

    @SuccessResponse(200, "Success")
    @Post()
    public async login(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ) : Promise<IReturnUser> {
        try {
            const response = await loginUser(req)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }
}

/**
 * Log out as a user. The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}". The token associated with the session is removed and can no longer be used for authentication. 
 */
@Route('/logout')
export class LogoutController extends Controller {
    @Example<void>(undefined)

    @Post()
    public async login(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ) : Promise<void> {
        try {
            const authReq: IAuthRequest = await authenticate(req)
            console.log('authReq.user', authReq.user)
            await logoutUser(authReq)
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }
}

// TO DO:
// jwt refresh token
// change credentials