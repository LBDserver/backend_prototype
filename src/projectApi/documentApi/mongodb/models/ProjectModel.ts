import * as mongoose from "mongoose"

const projectSchema: mongoose.Schema = new mongoose.Schema({
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

const Project = mongoose.model<mongoose.Document>('Project', projectSchema)

export default Project