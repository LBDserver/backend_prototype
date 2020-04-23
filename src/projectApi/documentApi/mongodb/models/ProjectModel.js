const mongoose = require('mongoose')
require('mongoose-type-url')
const File = require('./FileModel')

const projectSchema = new mongoose.Schema({
    url: {
        type: mongoose.SchemaTypes.Url,
        trim: true
    },
    // change objectid to webid later in the project
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    }
}, {
    timestamps: true
})

projectSchema.virtual('files', {
    ref: 'File',
    localField: '_id',
    foreignField: 'project'
})

projectSchema.pre('save', async function (next) {
    const project = this
    project.url = `http://localhost:5000/project/${project._id}`
    next()
})

projectSchema.pre('remove', async function (next) {
    const project = this
    console.log('deleting project', project._id)
    await File.deleteMany({ project: project._id })
    next()
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project