import { Body, Request, Controller, Delete, Get, Res, Post, Put, Route, TsoaResponse } from 'tsoa'
import { authenticate } from '../authApi/userFunctions'
import {ICreateProject, IReturnProject} from '../interfaces/projectInterface'
import {createProject, getAllProjects} from '../projectApi'
import * as express from 'express'
import { IAuthRequest } from '../interfaces/userInterface'

@Route('/lbd')
export class TodoController extends Controller {
    @Get()
    public async getAll(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnProject[]> {
        try {
            const authReq: IAuthRequest = await authenticate(req)
            const response = await getAllProjects(authReq)

            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Post()
    public async create(
        @Request() req: express.Request,
        @Body() body: ICreateProject,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnProject> {
        try {
            const authReq: IAuthRequest = await authenticate(req) 
            const response = await createProject(authReq)
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