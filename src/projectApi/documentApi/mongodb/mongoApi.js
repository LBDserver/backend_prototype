const { Project, File } = require('./models')
const { checkPermissions } = require('../../../authApi')
require('./mongoose')

// owned by current user
createProjectDoc = (body) => {
    return new Promise(async (resolve, reject) => {
        const project = new Project({
            ...body,
            url: `${process.env.SERVER_URL}/project/${encodeURIComponent(body.name)}`
        })
        try {
            await project.save()
            resolve(project)
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// ACL implemented
getProjectDoc = ({ projectId, user }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let project = await Project.findOne({ _id: projectId })

            if (!project) {
                reject({ status: 404, message: "Project not found" })
            }

            const accessPermitted = await checkPermissions(project.acl, ['acl:Read'], project.owner, user)

            if (accessPermitted) {
                project = await project.populate('files', '_id').execPopulate()
                let files = []
                project["lose"] = 'test'
                project.files.forEach(file => {
                    files.push(file._id)
                })
                resolve({ project: project, files, status: 200 })
            } else {
                reject({message: 'Forbidden', status: 403})
            }
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// only owner-permitted
getProjectsDoc = ({ owner }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const projects = await Project.find({ owner })
            if (!projects) {
                reject({ status: 404 })
            }
            resolve({ projects, status: 200 })
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// only owner-permitted
deleteProjectDoc = ({ projectId, user }) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('_id, owner', _id, owner)
            let project = await Project.findOne({ _id: projectId, owner: user })
            console.log('project', project)
            if (!project) {
                reject({ status: 404 })
            }

            project.remove()

            resolve({ project, status: 200 })
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// owned by current user
uploadDocuments = ({ projectId, data, user }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const project = await Project.findOne({ _id: projectId, owner: user })
            if (!project) {
                reject({ status: 404 })
            }

            const file = new File({
                main: data.file,
                name: data.name,
                project: projectId,
                owner: user,
                url: `${process.env.SERVER_URL}/project/${file.project}/files/${encodeURIComponent(data.name)}`
            })

            await file.save()
            resolve({ file, status: 200 })

        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// only owner-permitted
deleteDocuments = ([fields]) => {
    return
}

// ACL implemented
updateProjectDoc = ({ projectId, body, user }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let project = await Project.findOne({_id: projectId})
            if (!project) {
                reject({ status: 404 })
            }

            accessPermitted = await checkPermissions('private', ['acl:Write'], project.owner, user)

            if (accessPermitted) {
                let updates = Object.keys(body)
                console.log({ updates })
                const allowedUpdates = ['projectUri']
                let nonAllowedUpdates = updates.filter(x => !allowedUpdates.includes(x));
                updates = updates.filter(x => allowedUpdates.includes(x));
                updates.forEach((update) => project[update] = body[update])
                await project.save()

                resolve({ project, notPermitted: nonAllowedUpdates, status: 200 })
            } else {
                reject({message: 'Forbidden', status: 403})
            }

        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// ACL implemented
getProjectFile = async ({ projectName, fileId, user }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const file = await File.findOne({ _id: fileId, projectName })

            if (!file) {
                reject({ status: 404, message: 'File not found' })
            }

            if (accessPermitted) {
                await file.populate('project').execPopulate()
                resolve({ file, status: 200 })
            } else {
                reject({message: 'Forbidden', status: 403})
            }
        } catch (error) {
            console.log('error', error)
            reject(error)
        }
    })
}

// only admin
migrateMongo = () => {
    return new Promise(async (resolve, reject) => {
        try {

            if (newBaseUri.endsWith("/")) {
                newBaseUri = newBaseUri.slice(0, -1);
            }

            let files = await File.find({})
            const filePromises = files.map(async file => {
                const url = `${process.env.SERVER_URL}/project/${file.project._id}/files/${file._id}`
                file.url = url
                await file.save()
                return url
            })

            let projects = await Project.find({})
            const projectPromises = projects.map(async project => {
                const url = `${newBaseUri}/project/${project._id}`
                project.url = url
                await project.save()
                return url
            })

            await Promise.all(filePromises)
            await Promise.all(projectPromises)

            resolve()

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
    deleteDocuments,
    getProjectFile,
    migrateMongo
}