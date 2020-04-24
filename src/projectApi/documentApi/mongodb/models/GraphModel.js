const mongoose = require('mongoose')
require('mongoose-type-url')

const graphSchema = new mongoose.Schema({
    url: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    acl: {
        type: String,
        default: 'https://lbdserver.com/acl/private'
    },
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    }
}, {
    timestamps: true
})


graphSchema.pre('remove', async function (next) {
    const project = this
    console.log('deleting project', project._id)
    await File.deleteMany({ project: project._id })
    next()
})

const Graph = mongoose.model('Graph', graphSchema)

module.exports = Graph