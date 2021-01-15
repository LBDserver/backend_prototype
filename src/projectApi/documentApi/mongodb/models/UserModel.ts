import * as mongoose from 'mongoose'
import validator from 'validator'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

import { IUser } from 'lbd-server'
import Project from './ProjectModel'

// about a single UserDocument (e.g. dynamic methods)
export interface IUserDocument extends mongoose.Document, IUser {
    generateAuthToken(): string;
}

// about the UserModel itself (e.g. static methods)
export interface IUserModel extends mongoose.Model<IUserDocument> {
    findByCredentials(email: string, password: string): IUserDocument;
}

const userSchema: mongoose.Schema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    uri: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    tokens: [{
        type: String,
        required: true
    }],
    projects: [{
        type: String,
        ref: "Project"
    }]
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    console.log('this', this)
    const token = jwt.sign({ _id: user._id.toString() }, process.env.TOKEN_SECRET)
    console.log('token', token)
    user.tokens = user.tokens.concat(token)
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async function (email: string, password: string): Promise<IUserDocument> {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

userSchema.pre<IUserDocument>('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

userSchema.pre('remove', async function (next) {
    const owner = this
    await Project.deleteMany({ owner })
    next()
})

// should take both interfaces
const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema)

export default User