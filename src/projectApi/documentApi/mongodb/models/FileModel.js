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
    project:
        {
            type: String,
            ref: "Project",
            required: true
        },
    owner: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

const File = mongoose.model('File', fileSchema)

module.exports = File