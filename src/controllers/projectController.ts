import { Body, Request, Controller, Delete, Get, Res, Post, Put, Route, TsoaResponse, Path } from 'tsoa'
import { authenticate, authorize } from '../authApi/userFunctions'
import {ICreateProject, IReturnProject} from '../interfaces/projectInterface'
import * as api from '../projectApi'
import * as express from 'express'
import { IAuthRequest } from '../interfaces/userInterface'

@Route('/lbd')
export class ProjectController extends Controller {
    @Get()
    public async getAllProjects(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnProject[]> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            const response = await api.getAllProjects(authReq)

            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Get('/public')
    public async getPublicProjects(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnProject[]> {
        try {
            const response = await api.getPublicProjects(req)

            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }
    
    @Get('/{projectName}')
    public async getOneProject(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnProject[]> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            const response = await api.getOneProject(authReq)
            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Post()
    public async createProject(
        @Request() req: express.Request,
        @Body() body: ICreateProject,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnProject> {
        try {
            const authReq: IAuthRequest = await authenticate(req) 
            const response = await api.createProject(authReq)
            this.setStatus(201)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Delete('/{projectName}')
    public async deleteProject(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<void> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            await api.deleteProject(authReq)
            this.setStatus(200)
            return
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }
}