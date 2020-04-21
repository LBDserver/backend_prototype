const {createProjectGraph} = require('./graphApi/graphdb')
const {createProjectDoc} = require('./documentApi/mongodb')

createProject = async (req, res) => {
    try {
        const graphData = await createProjectGraph()
        const documentData = await createProjectDoc()
    
        return res.json({graphData, documentData})
    } catch (error) {
        return res.json({error})
    }

}

getAllProjects = (req, res) => {
    return res.json({message: 'this function is not implemented yet'})
}

getOneProject = (req, res) => {
    return res.json({message: 'this function is not implemented yet'})
}

updateProject = (req, res) => {
    return res.json({message: 'this function is not implemented yet'})
}

deleteProject = (req, res) => {
    return res.json({message: 'this function is not implemented yet'})
}

queryProject = (req, res) => {
    return res.json({message: 'this function is not implemented yet'})
}

module.exports = {
    getAllProjects,
    createProject,
    getOneProject,
    updateProject,
    deleteProject,
    queryProject,
}