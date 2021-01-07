import {app} from './app'
import * as http from 'http'
import * as mongoose from 'mongoose'

const server = http.createServer(app)
server.listen(process.env.PORT)

server.on('listening', async () => {
    console.info(`Listening on port ${process.env.PORT}`)
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        useCreateIndex: true,
        useFindAndModify: true
    })
    mongoose.connection.on('open', () => {
        console.info('Connected to MongoDB')
    })
    mongoose.connection.on('error', (err: any) => {
        console.error(err)
    })
})

// process.on('warning', (warning) => {
//     console.log(warning.stack);
// });