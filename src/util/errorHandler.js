errorHandler = (error) => {
    console.log('error', error)
    try {
        return {reason: error.reason, status: error.status}
    } catch (error) {
        console.log('error', error)
        return {reason: 'Internal server error', status: 500}
    }
}

module.exports = errorHandler