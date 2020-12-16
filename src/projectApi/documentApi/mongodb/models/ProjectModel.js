const mongoose = require('mongoose')
require('mongoose-type-url')
const File = require('./FileModel')

const projectSchema = new mongoose.Schema({
    _id: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        required: true
    }
}, {
    _id: false
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project