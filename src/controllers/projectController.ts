import { Body, Request, Controller, Delete, Get, Res, Post, Put, Route, TsoaResponse, Path, Header, Query } from 'tsoa'
import { authenticate, authorize } from '../authApi/userFunctions'
import {
    ICreateProject,
    IReturnProject ,
    IReturnMetadata,
    IReturnGraph
} from 'lbd-server'
import {
    IAuthRequest
} from '../interfaces/userInterface'
import * as api from '../projectApi'
import * as express from 'express'
import * as multer from 'multer'

@Route('/lbd')
export class ProjectController extends Controller {
    ///////////////// PROJECT API ///////////////////////////////

    /**
     * Retrieves all the projects associated with the authenticated user. The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param req 
     * @param serverErrorResponse 
     */
    @Get()
    public async getAllProjects(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Accept") mimeType?: string,
        @Header("Authorization") authorization?: string
    ): Promise<IReturnProject[]> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            const response = await api.getAllProjects(authReq)

            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Retrieves the public (openly accessible) projects on the local LBDserver instance. These are, among others, projects that have been created with the property "open": true (and for which the ACL graph has not been modified to make it closed again). User authentication is NOT required. 
     * @param req 
     * @param serverErrorResponse 
     */
    @Get('/public')
    public async getPublicProjects(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Accept") mimeType?: string
    ): Promise<IReturnProject[]> {
        try {
            const response = await api.getPublicProjects(req)
            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Get a specific project by its ID (i.e. using the project URL). The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}". Whether authentication is mandatory depends on the ACL policy of the requested resource. (e.g. an open project may grant READ access to an unauthenticated agent).
     * @param projectName 
     * @param req 
     * @param serverErrorResponse 
     */
    @Get('/{projectName}')
    public async getOneProject(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Accept") mimeType?: string,
        @Header("Authorization") authorization?: string,
        @Query() query?: string
    ): Promise<IReturnProject> {
        try {
            console.log('query', query)
            console.log('req.query', req.query)
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            const response = await api.getOneProject(authReq)
            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Get a specific project by its ID (i.e. using the project URL). The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}". Whether authentication is mandatory depends on the ACL policy of the requested resource. (e.g. an open project may grant READ access to an unauthenticated agent).
     * @param projectName 
     * @param req 
     * @param serverErrorResponse 
     */
    @Put('/{projectName}')
    public async updateOneProject(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Query() update: string,
        @Header("Authorization") authorization?: string,
    ): Promise<void> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            await api.updateProject(authReq)
            this.setStatus(201)
            return
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Create a new project, with the fields "title", "description" and an optional "open". The title and description are registered within the project metadata (as rdfs:label and rdfs:comment), while the "open" parameter is used to create an initial Access Control graph ("open": true means that every agent has Read access to the project). Authentication is mandatory (default); the user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param req 
     * @param body 
     * @param serverErrorResponse 
     */

    @Post()
    public async createProject(
        @Request() req: express.Request,
        @Body() body: ICreateProject,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Accept") mimeType?: string,
        @Header("Authorization") authorization?: string
    ): Promise<IReturnProject> {
        try {
            const authReq: IAuthRequest = await authenticate(req)
            const response = await api.createProject(authReq)
            this.setStatus(201)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Delete a project by its ID (i.e. using the project URL). Authentication is mandatory; the user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param projectName 
     * @param req 
     * @param serverErrorResponse 
     */
    @Delete('/{projectName}')
    public async deleteProject(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Accept") mimeType?: string,
        @Header("Authorization") authorization?: string
    ): Promise<void> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            await api.deleteProject(authReq)
            this.setStatus(200)
            return
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /////////////////////// FILE API //////////////////////////
    /**
     * Get a project File by its ID (i.e. via the File URL). The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}". Whether authentication is mandatory depends on the ACL policy of the requested resource. (e.g. an open project may grant READ access to an unauthenticated agent).
     * @param projectName 
     * @param fileId 
     * @param req 
     * @param serverErrorResponse 
     */
    @Get('/{projectName}/files/{fileId}.meta')
    public async getFileMeta(
        @Path() projectName: string,
        @Path() fileId: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ): Promise<IReturnMetadata> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            const data: IReturnMetadata = await api.getDocumentMetadata(authReq)
            this.setStatus(200)
            return data
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

        /**
     * Get a project File by its ID (i.e. via the File URL). The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}". Whether authentication is mandatory depends on the ACL policy of the requested resource. (e.g. an open project may grant READ access to an unauthenticated agent).
     * @param projectName 
     * @param fileId 
     * @param req 
     * @param serverErrorResponse 
     */
    @Get('/{projectName}/files/{fileId}')
    public async getOneFile(
        @Path() projectName: string,
        @Path() fileId: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ) {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            const data = await api.getDocumentFromProject(authReq)
            const response = (<any>req).res as express.Response 
            if (data) {
                response.end(Buffer.from(data, "base64"))
            }
            //only for documentation purposes
            // return Buffer.from(data)
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Upload a new document (non-RDF resource) to the LBDserver. A UUID is generated for the document, its full URI is {projectURI}/files/{fileID}. A metadata graph (RDF!) gets created at {projectURI}/files/{fileID}.meta. The file should be sent as FormData with, with fileName "resource". The "label" and the "description" (body: as strings) are stored in the metadata graph, as well as a reference to the Access Control graph that applies to the new resource. If no ACL is specified, the metadata points towards the default project ACL (which was created at project setup). When creating a new file, a user may choose to upload a specific ACL graph along with the file itself. The ACL graph then is a FormData file identified by the fileName "acl". A final option is to point at an already existing ACL graph in the project, by including a (string) reference in the request body "acl". Note that there is currently no validation to check is an ACL graph is valid. Authentication is mandatory (default); the user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param projectName 
     * @param req 
     * @param serverErrorResponse 
     */
    @Post('/{projectName}/files/')
    public async createNewFile(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ): Promise<IReturnMetadata> {
        try {
            await this.handleFile(req)
            const authReq: IAuthRequest = await authenticate(req)
            const response: IReturnMetadata = await api.uploadDocumentToProject(authReq)
            this.setStatus(201)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Delete a project resource (non RDF) by its ID (i.e. using the project URL). Authentication is mandatory (default); the user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param projectName 
     * @param fileId 
     * @param req 
     * @param serverErrorResponse 
     */
    @Delete('/{projectName}/files/{fileId}')
    public async deleteOneFile(
        @Path() projectName: string,
        @Path() fileId: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ): Promise<void> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            await api.deleteDocumentFromProject(authReq)
            this.setStatus(200)
            return
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /////////////////////// GRAPH API //////////////////////////
    /**
     * Get a project graph by its ID (i.e. via the graph URL). The user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}". Whether authentication is mandatory depends on the ACL policy of the requested resource. (e.g. an open project may grant READ access to an unauthenticated agent).
     * @param projectName 
     * @param graphId 
     * @param req 
     * @param serverErrorResponse 
     */
    @Get('/{projectName}/graphs/{graphId}')
    public async getOneGraph(
        @Path() projectName: string,
        @Path() graphId: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Accept") mimeType?: string,
        @Header("Authorization") authorization?: string,
        @Query() query?: string
    ): Promise<IReturnGraph> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            const response: IReturnGraph = await api.getNamedGraph(authReq)
            this.setStatus(200)
            return response
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Upload a new graph (RDF resource) to the LBDserver. A UUID is generated for the graph, its full URI is {projectURI}/graphs/{graphID}. A metadata graph (RDF) gets created at {projectURI}/graph/{graph}.meta. The graph should be sent as FormData with, with fileName "resource". The "label" and the "description" (body: as strings) are stored in the metadata graph, as well as a reference to the Access Control graph that applies to the new resource. If no ACL is specified, the metadata points towards the default project ACL (which was created at project setup). When creating a new file, a user may choose to upload a specific ACL graph along with the file itself. The ACL graph then is a FormData file identified by the fileName "acl". A final option is to point at an already existing ACL graph in the project, by including a (string) reference in the request body "acl". Note that there is currently no validation to check is an ACL graph is valid. Authentication is mandatory (default); the user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param projectName 
     * @param req 
     * @param serverErrorResponse 
     */
    @Post('/{projectName}/graphs/')
    public async createNewGraph(
        @Path() projectName: string,
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ): Promise<IReturnMetadata> {
        try {
            await this.handleFile(req)
            const authReq: IAuthRequest = await authenticate(req)
            const response: IReturnMetadata = await api.createNamedGraph(authReq)
            this.setStatus(201)
            return response
        } catch (error) {
            // console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
        }
    }

    /**
     * Delete a project resource (graph) by its ID (i.e. using the project URL). Authentication is mandatory (default); the user is authenticated via a Bearer token sent along with the request as a header "Authorization: Bearer {token}".
     * @param req 
     * @param serverErrorResponse 
     */
    @Delete('/{projectName}/graphs/{graphId}')
    public async deleteOneGraph(
        @Request() req: express.Request,
        @Res() serverErrorResponse: TsoaResponse<500, { reason: {[key: string]: any}, message: string }>,
        @Header("Authorization") authorization?: string
    ): Promise<void> {
        try {
            let authReq: IAuthRequest = await authenticate(req)
            authReq = await authorize(authReq)
            await api.deleteNamedGraph(authReq)
            this.setStatus(200)
            return
        } catch (error) {
            console.error('error', error)
            serverErrorResponse(500, {reason: error, message: error.message})
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