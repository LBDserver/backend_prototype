import { Body, Request, Controller, Delete, Get, Res, Post, Put, Route, TsoaResponse, Path } from 'tsoa'
import { authenticate } from '../authApi/userFunctions'
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
            const authReq: IAuthRequest = await authenticate(req)
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
            const authReq: IAuthRequest = await authenticate(req) 
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

    // @Put('/{id}')
    // public async update(id: string, @BodyProp() description: string) : Promise<void> {
    //     await Todo.findByIdAndUpdate(id, {description})
    // }

    // @Delete('/{id}')
    // public async remove(id: string) : Promise<void> {
    //     await Todo.findByIdAndDelete(id)
    // }
}