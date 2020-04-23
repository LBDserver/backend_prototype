const mongoose = require('mongoose')
require('mongoose-type-url')

const fileSchema = new mongoose.Schema({
    main: {
        type: Buffer,
        required: true
    },
    url: {
        type: mongoose.SchemaTypes.Url
    },
    acl: {
        type: mongoose.SchemaTypes.Url
    },
    project:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    }
}, {
    timestamps: true
})

fileSchema.pre('save', async function (next) {
    const file = this
    file.url = `http://localhost:5000/project/${file.project}/files/${file._id}`
    next()
})
const File = mongoose.model('File', fileSchema)

module.exports = File