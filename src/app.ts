import * as express from "express"
import * as cors from 'cors'
import * as bodyparser from 'body-parser'

import {RegisterRoutes} from './routes'
import * as swaggerUi from 'swagger-ui-express'
import errorHandler from "./util/errorHandler.middleware"
import notFoundHandler from "./util/notfoundHandler.middleware"
import requestLoggerMiddleware from "./util/requestLogger.middleware"

const app = express()
app.use(cors())
app.use(bodyparser.json())
app.use(requestLoggerMiddleware)

RegisterRoutes(app)

app.use(errorHandler)

// set the swagger.json documentation at the /docs route
try {
    const swaggerDocument = require('../swagger.json')
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
} catch (error) {
    console.error('Unable to read swagger.json', error)
}

app.use(notFoundHandler)
export {app}