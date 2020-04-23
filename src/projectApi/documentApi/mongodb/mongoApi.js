const { Project, File } = require('./models')
require('./mongoose')

createProjectDoc = (body) => {
    return new Promise(async (resolve, reject) => {
        const project = new Project({
            ...body,
        })
        try {
            await project.save()
            resolve({project, status: 201})
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getProjectDoc = ({_id, owner}) => {
    return new Promise(async (resolve, reject) => {
        try {
            let project = await Project.findOne({_id, owner})

            if (!project) {
                reject({status: 404, message: "Project not found"})
            }

            project = await project.populate('files', '_id').execPopulate()
            let files = []
            project["lose"] = 'test'
            project.files.forEach(file => {
                files.push(file._id)
            })
            resolve({project: project, files, status: 200})
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

getProjectsDoc = ({owner}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const projects = await Project.find({owner})
            if (!projects) {
                reject({status: 404})
            }
            resolve({projects, status: 200})
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

deleteProjectDoc = ({_id, owner}) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('_id, owner', _id, owner)
            let project = await Project.findOne({_id, owner})
            console.log('project', project)
            if (!project) {
                reject({status: 404})
            }

            project.remove()

            resolve({project, status: 200})
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

uploadDocuments = ({_id, main, owner}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const project = await Project.findOne({_id, owner})
            if (!project) {
                reject({status: 404})
            }

            const file = new File({
                main,
                project: _id,
                owner
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

updateProjectDoc = ({_id, body, owner}) => {
    return new Promise(async (resolve, reject) => {
        try {
            let updates = Object.keys(body)
            console.log({updates})
            const allowedUpdates = ['projectUri']
            let nonAllowedUpdates =  updates.filter(x => !allowedUpdates.includes(x));
            updates =  updates.filter(x => allowedUpdates.includes(x));

            let project = await Project.findOne({_id, owner})
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

getProjectFile = async ({projectId, fileId, owner}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const file = await File.findOne({_id: fileId, owner, project: projectId})
            if (!file) {
                reject({status: 404, message: 'File not found'})
            }

            await file.populate('project').execPopulate()
            resolve({file, status: 200})

        } catch (error) {
            console.log('error', error)
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
    removeDocuments,
    getProjectFile
}