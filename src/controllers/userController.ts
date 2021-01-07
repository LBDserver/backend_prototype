import { Controller, Example, Post, Route, SuccessResponse, TsoaResponse, Res, Body, Request } from 'tsoa'
import { authenticate, createUser, loginUser, logoutUser } from '../authApi/userFunctions'
import { IUser, IRegisterRequest, IReturnUser, IAuthRequest } from '../interfaces/userInterface'
import * as express from 'express'

const userExample = {
    user: {
        username: "max",
        email: "max@mustermann.be",
        projects: [],
        tokens: []
    },
    token: "theBearerToken"
}

@Route('/register')
export class RegisterController extends Controller {
    @Example<IReturnUser>(userExample)

    @Post()
    public async register(
        @Request() req: express.Request,
        @Body() body: IRegisterRequest,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ) : Promise<IReturnUser> {
        try {
            const response = await createUser(req)
            this.setStatus(201)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }
}

@Route('/login')
export class LoginController extends Controller {
    @Example<IReturnUser>(userExample)

    @SuccessResponse(200, "Success")
    @Post()
    public async login(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ) : Promise<IReturnUser> {
        try {
            const response = await loginUser(req)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: "Internal Server Error" })
        }
    }
}

@Route('/logout')
export class LogoutController extends Controller {
    @Example<void>(undefined)

    @Post()
    public async login(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ) : Promise<void> {
        try {
            const authReq: IAuthRequest = await authenticate(req)
            console.log('authReq.user', authReq.user)
            await logoutUser(authReq)
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: "Internal Server Error" })
        }
    }
}

// TO DO:
// jwt refresh token
// change credentials