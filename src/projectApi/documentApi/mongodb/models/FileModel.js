const mongoose = require('mongoose')
require('mongoose-type-url')

const fileSchema = new mongoose.Schema({
    main: {
        type: Buffer,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    acl: {
        type: String,
        default: 'https://lbdserver.com/acl/private'
    },
    description: {
        type: String, 
        required: true
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

const File = mongoose.model('File', fileSchema)

module.exports = File