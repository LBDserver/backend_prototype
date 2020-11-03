const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true 
}).then(() => console.log('\nConnection with document store established\n'))
.catch((error) => console.log('Failed to establish a connection with the document store', error))