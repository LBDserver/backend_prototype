import * as graphStore from "../projectApi/graphApi/graphdb"
import * as docStore from '../projectApi/documentApi/mongodb'

const writeActions = {
    createRepository: {status: undefined, undo: graphStore.deleteRepository},
    createProjectMetadata: {status: undefined, undo: graphStore.deleteNamedGraph},
    createProjectAcl: {status: undefined, undo: graphStore.deleteNamedGraph},
    createProjectDocument: {status: undefined, undo: docStore.deleteProjectDoc},
    registerProjectDocumentWithUser: {status: undefined, undo: docStore.removeProjectFromUser}
}