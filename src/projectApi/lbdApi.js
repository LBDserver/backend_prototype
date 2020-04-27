const graphStore = require('./graphApi/graphdb')
const docStore = require('./documentApi/mongodb')

//////////////////////////// PROJECT API ///////////////////////////////
// create new project owned by the user
createProject = async (req, res) => {
    try {

        const owner = req.user
        const {title, description, acl} = req.body
        const fullTitle = `${owner.username}-${title}`
        const metaTitle = `${process.env.SERVER_URL}/default.meta`
        const repoUrl = `${process.env.GRAPHDB_URL}/rest/repositories/${fullTitle}`

        // project title must be unique
        if (req.user.projects.includes(repoUrl)) {
            throw new Error('Project already exists. Please specify a unique name.')
        }

        const repoMetaData = graphStore.namedGraphMeta(repoUrl, acl, owner.url, fullTitle, description)
        // create project repository graphdb
        await graphStore.createRepository(fullTitle, fullTitle)
        // create its metadata named graph (which refers to acl etc.)
        await graphStore.createNamedGraph(fullTitle, {name: repoUrl, context: metaTitle, baseURI: metaTitle, data: repoMetaData })
        // save the project to the projects field of the owner (mongo)
        owner.projects.push({Graph_url: repoUrl, LBD_url: `${process.env.SERVER_URL}/project/${fullTitle}`})
        await owner.save()

        return res.status(201).json({ message: "Project repository and metadata graph created", url: repoUrl })

    } catch (error) {
        console.log('error', error)
        return res.status(500).json({ error })
    }
}

// send back all projects OWNED by the user
getAllProjects = async (req, res) => {
    try {
        return res.status(200).json({ projects: req.user.projects })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ error })
    }
}

// send back project metadata.
getOneProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user
        const projectGraph = await graphStore.getNamedGraph(`${process.env.SERVER_URL}/default.meta`, projectName, '', 'turtle')
        return res.status(200).json({ projectGraph })
    } catch (error) {
        return res.status(404).json({ message: 'Project not found' })
    }
}

// updates the main project data. Not expected to happen very much. 
// discuss implementation. This will actually use the updateNamedGraph function on the .meta graph of the project.
updateProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user
        const body = req.body
        // updates docdbinformation
        // if id or uri changes, also update graphdb
        const documentData = await docStore.updateProjectDoc({_id, body, owner})
        return res.status(documentData.status).json({ project: documentData.project, nonPermittedUpdates: documentData.notPermitted })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ message: 'Project not found' })
    }
}

deleteProject = async (req, res) => {
    try {
        const projectName = req.params.projectName
        const owner = req.user

        // delete from graph store
        await graphStore.deleteRepository(projectName)
        // delete from list in document store (user)
        let newProjectList = owner.projects.filter(project => {
            return project.Graph_url !== `${process.env.GRAPHDB_URL}/rest/repositories/${projectName}`
        })
        owner.projects = newProjectList
        await owner.save()

        return res.status(200).json({ message: `Project ${projectName} was deleted.` })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({message: "Project not found"})
    }
}

//////////////////////////// QUERY API ///////////////////////////////
queryProject = async (req, res) => {
    // query project with sparql
    // add option to immediately fetch files (getFile)
    return res.json({ message: 'this function is not implemented yet' })
}

//////////////////////////// document API ///////////////////////////////
uploadDocumentToProject = async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        const main = req.file.buffer

        // upload document
        // attach document information to graphdb
        const documentData = await docStore.uploadDocuments({_id, main, owner})

        return res.status(documentData.status).json({ url: documentData.file.url })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ message: 'Project not found' })
    }
}


getDocumentFromProject = async (req, res) => {
    try {
        // only access docdb
        const projectName = req.params.projectName
        const fileId = req.params.fileId
        const owner = req.user._id
        const file = await docStore.getProjectFile({projectName, fileId, owner})

        return res.status(file.status).json({ file: file.file })
    } catch (error) {
        console.log('error', error)
        return res.status(404).json({ error })
    }
}


//////////////////////////// NAMED GRAPHS API ///////////////////////////////
getNamedGraph = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

updateNamedGraph = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

deleteNamedGraph = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

createNamedGraph = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

replaceNamedGraph = async (req, res) => {
    return res.json({ message: 'this function is not implemented yet' })
}

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
    getDocumentFromProject,
    uploadDocumentToProject,
    getNamedGraph,
    createNamedGraph,
    deleteNamedGraph,
    updateNamedGraph,
    replaceNamedGraph
}
