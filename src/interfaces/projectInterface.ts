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
    message?: string
}

interface IResourceObject {
    [x: string]: string
}

export {
    ICreateProject,
    IReturnProject 
}