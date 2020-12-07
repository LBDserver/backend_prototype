const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT
const btoa = require('btoa-lite')

const projectRoutes = require('./routes/projectRoutes')
const authRoutes = require('./routes/authRoutes')

app.use(express.json())
app.use(cors())

app.use('/lbd', projectRoutes)
app.use('/', authRoutes)

// Server listening
app.listen(port, () => {
    console.log("\nServer up on port", port)
})