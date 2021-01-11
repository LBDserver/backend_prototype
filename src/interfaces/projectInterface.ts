import * as express from 'express'

interface ICreateProject {
    title: string,
    description: string,
    open: boolean
}

// change graphs and documents to objects with specific fields (metadata)
// maybe also permissions field
interface IReturnProject {
    metadata: string,
    id: string,
    graphs: IResourceObject,
    documents: IResourceObject,
    permissions?: string[],
    queryResults?: IQueryResults,
    message?: string
}

interface IQueryResults {
    head: {
        vars: string[]
    },
    results: {
        bindings: {
            [variable: string]: {
                type: string,
                value: string
            }[]
        }
    }

}

interface IResourceObject {
    [x: string]: string
}

interface IUploadResourceRequest extends express.Request {
    resource?: Buffer
}

interface IReturnResource {
    uri: string,
    metadata?: string,
    data?: Buffer | string,
    results?: IQueryResults
}

export {
    ICreateProject,
    IReturnProject ,
    IUploadResourceRequest,
    IReturnResource,
    IQueryResults
}