import * as express from "express"
import { ValidateError } from "tsoa"

function errorHandler(
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) : express.Response | void {
    if (err instanceof ValidateError) {
        console.warn(`Caught validation error for ${req.path}:`, err.fields)
        return res.status(422).json({
            message: "Validation failed",
            details: err.fields
        })
    }
    if (err instanceof Error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }

    next()
}

export default errorHandler
