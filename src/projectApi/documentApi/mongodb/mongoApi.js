const { Project, File } = require('./models')
require('./mongoose')

createProjectDoc = (body) => {
    return new Promise(async (resolve, reject) => {
        const project = new Project({
            ...body
        })
        try {
            await project.save()
            resolve({project, status: 201})
        } catch (error) {
            reject(error)
        }
    })
}

getProjectDoc = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let project = await Project.findById(_id)

            if (!project) {
                reject({status: 404})
            }

            project = await project.populate('files', '_id').execPopulate()
            let files = []
            project["lose"] = 'test'
            project.files.forEach(file => {
                files.push(file._id)
            })
            resolve({project: project, files, status: 200})
        } catch (error) {
            reject(error)
        }
    })
}

getProjectsDoc = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const projects = await Project.find({})
            if (!projects) {
                reject({status: 404})
            }
            resolve({projects, status: 200})
        } catch (error) {
            reject(error)
        }
    })
}

deleteProjectDoc = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const project = await Project.findOneAndDelete(_id)
            if (!project) {
                reject({status: 404})
            }
            resolve({project, status: 200})
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

uploadDocuments = (projectId, data, uri, acl) => {
    return new Promise(async (resolve, reject) => {
        try {
            const project = Project.findById(projectId)
            if (!project) {
                reject({status: 404})
            }
            const file = new File({
                main: data,
                uri,
                project: projectId
            })

            await file.save()
            resolve({file, status: 200})

        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

removeDocuments = ([fields]) => {
    return
}

updateProjectDoc = (_id, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            let updates = Object.keys(body)
            console.log({updates})
            const allowedUpdates = ['projectUri']
            let nonAllowedUpdates =  updates.filter(x => !allowedUpdates.includes(x));
            updates =  updates.filter(x => allowedUpdates.includes(x));

            let project = await Project.findById(_id)
            if (!project) {
                reject({status: 404})
            }

            updates.forEach((update) => project[update] = body[update])
            await project.save()
            resolve({project, notPermitted: nonAllowedUpdates, status: 200})
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getProjectFile = async (projectId, documentUri) => {
    return new Promise(async (resolve, reject) => {
        try {
            const file = await File.findOne({uri: documentUri})
            if (!file) {
                reject({status: 404})
            }

            await file.populate('project').execPopulate()
            resolve({file, status: 200})

        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    createProjectDoc,
    getProjectDoc,
    getProjectsDoc,
    deleteProjectDoc,
    updateProjectDoc,
    uploadDocuments,
    removeDocuments
}