import * as mongoose from 'mongoose'

const fileSchema: mongoose.Schema = new mongoose.Schema({
    main: {
        type: Buffer,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    project:
        {
            type: String,
            ref: "Project",
            required: true
        }
}, {
    timestamps: true
})

const File = mongoose.model<mongoose.Document>('File', fileSchema)

export default File