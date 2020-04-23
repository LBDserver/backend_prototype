const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/lbd-mongo', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true 
}).then(() => console.log('\nConnection with document store established\n'))
.catch((error) => console.log('Failed to establish a connection with the document store', error))