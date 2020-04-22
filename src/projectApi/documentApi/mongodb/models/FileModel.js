const mongoose = require('mongoose')
require('mongoose-type-url')

const fileSchema = new mongoose.Schema({
    main: {
        type: Buffer,
        required: true
    },
    uri: {
        type: mongoose.SchemaTypes.Url,
        required: true
    },
    acl: {
        type: mongoose.SchemaTypes.Url
    },
    project:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        }
}, {
    timestamps: true
})

const File = mongoose.model('File', fileSchema)

module.exports = File