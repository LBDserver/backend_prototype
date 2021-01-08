import { Body, Request, Controller, Delete, Get, Res, Post, Put, Route, TsoaResponse, Path } from 'tsoa'
import { authenticate, authorize } from '../authApi/userFunctions'
import {
    ICreateProject,
    IReturnProject ,
    IUploadResourceRequest,
    IReturnResource
} from '../interfaces/projectInterface'
import {
    IUser,
    IRegisterRequest,
    ILoginRequest,
    IReturnUser,
    IAuthRequest
} from '../interfaces/userInterface'
import * as api from '../projectApi'
import * as express from 'express'
import * as multer from 'multer'

@Route('/lbd')
export class ProjectController extends Controller {
    ///////////////// PROJECT API ///////////////////////////////
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
        @Path() projectName: string,
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

    /////////////////////// FILE API //////////////////////////
    @Get('/{projectName}/files/{fileId}')
    public async getOneFile(
        @Path() projectName: string,
        @Path() fileId: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnResource> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            const response = await api.getDocumentFromProject(authReq)
            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Post('/{projectName}/files/')
    public async createNewFile(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<IReturnResource> {
        try {
            await this.handleFile(req)
            const authReq: IAuthRequest = await authenticate(req)
            const response: IReturnResource = await api.uploadDocumentToProject(authReq)
            this.setStatus(201)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Delete('/{projectName}/files/{fileId}')
    public async deleteOneFile(
        @Path() projectName: string,
        @Path() fileId: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<void> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            await api.deleteDocumentFromProject(authReq)
            this.setStatus(200)
            return
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    /////////////////////// GRAPH API //////////////////////////
    @Get('/{projectName}/graphs/{graphId}')
    public async getOneGraph(
        @Path() projectName: string,
        @Path() graphId: string,
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

    @Post('/{projectName}/graphs/')
    public async createNewGraph(
        @Request() request: express.Request,
        // @Body() body: IUploadResourceBody,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: string }>
    ): Promise<void> {
        try {
            // await multer().fields([{name: 'resource'}, {name: 'acl'}])
            await this.handleFile(request)
            console.log('req.resource', request["resource"])
            // const authReq: IAuthRequest = await authenticate(req)
            // const response = await api.createProject(authReq)
            this.setStatus(201)
            return 
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, { reason: error.message })
        }
    }

    @Delete('/{projectName}/graphs/{graphId}')
    public async deleteOneGraph(
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

    /////////////// HELPER FUNCTIONS ////////////////////
    private handleFile(request: express.Request): Promise<void> {
        const multerSingle = multer().fields([{name: 'resource'}, {name: 'acl'}]);
        return new Promise((resolve, reject) => {
          multerSingle(request, undefined, async (error) => {
            if (error) {
              reject(error);
            }
            resolve();
          });
        });
      }
}