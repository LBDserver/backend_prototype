const mongoose = require('mongoose')
require('mongoose-type-url')

const projectSchema = new mongoose.Schema({
    projectUri: {
        type: mongoose.SchemaTypes.Url,
        required: true,
        trim: true
    }
}, {
    timestamps: true
})

projectSchema.virtual('files', {
    ref: 'File',
    localField: '_id',
    foreignField: 'project'
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project