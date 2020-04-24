const express = require('express')

const app = express()
const port = process.env.PORT

const projectRoutes = require('./routes/projectRoutes')
const authRoutes = require('./routes/authRoutes')

app.use(express.json())

app.use('/project', projectRoutes)
app.use('/', authRoutes)

// Server listening
app.listen(port, () => {
    console.log("\nServer up on port", port)
})