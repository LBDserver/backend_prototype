import * as express from 'express'

function notFoundHandler(_req, res: express.Response) {
    res.status(404).send({
        message: "Not Found"
    })

}

export default notFoundHandler