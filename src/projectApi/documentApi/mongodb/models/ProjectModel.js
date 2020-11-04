const mongoose = require('mongoose')
require('mongoose-type-url')
const File = require('./FileModel')

const projectSchema = new mongoose.Schema({
    id: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String, 
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

projectSchema.pre('remove', async function (next) {
    const project = this
    console.log('deleting project', project._id)
    await File.deleteMany({ project: project._id })
    next()
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project