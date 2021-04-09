const { Project, File } = require("./models");
const { checkPermissions } = require("../../../authApi");
const { v4 } = require("uuid");
const { createBucket } = require("mongoose-gridfs");
const { Readable } =require('stream')

async function createProjectDoc(url, _id) {
  try {
    const project = new Project({ url, _id });
    await project.save();
    return project;
  } catch (error) {
    error.message = `Unable to create project with id ${id} in the document store; ${error.message}`;
    throw error;
  }
}

async function deleteProjectDoc(id) {
  try {
    await Project.findByIdAndDelete(id);
    return true;
  } catch (error) {
    error.message = `Unable to delete project with id ${id}; ${error.message}`;
    throw error;
  }
}

async function pushProjectToCreator(id, creator) {
  try {
    creator.projects.push(id);
    await creator.save();
    return true;
  } catch (error) {
    error.message = `Unable to push project with id ${id} to creator ${creator.uri}; ${error.message}`;
    throw error;
  }
}

async function deleteProjectFromUser(id, user) {
  try {
    let newProjectList = user.projects.filter((project) => {
      return project !== id;
    });
    user.projects = newProjectList;
    await user.save();
    return true;
  } catch (error) {
    error.message = `Unable to remove project with id ${id} from user ${user.uri}; ${error.message}`;
    throw error;
  }
}

async function findAllProjectDocuments() {
  try {
    const projects = await Project.find();
    return projects;
  } catch (error) {
    error.message = `Unable to find all project documents; ${error.message}`;
    throw error;
  }
}
// ACL implemented
// getProjectDoc = ({ projectId, user }) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let project = await Project.findOne({ _id: projectId })

//             if (!project) {
//                 reject({ status: 404, message: "Project not found" })
//             }

//             project = await project.populate('files', '_id').execPopulate()
//             let files = []
//             project["lose"] = 'test'
//             project.files.forEach(file => {
//                 files.push(file._id)
//             })
//             resolve({ project: project, files, status: 200 })
//         } catch (error) {
//             console.log('error', error)
//             reject(error)
//         }
//     })
// }

// only owner-permitted
// getProjectsDoc = ({ owner }) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const projects = await Project.find({ owner })
//             if (!projects) {
//                 reject({ status: 404 })
//             }
//             resolve({ projects, status: 200 })
//         } catch (error) {
//             console.log('error', error)
//             reject(error)
//         }
//     })
// }

async function uploadDocument(id, data) {
  try {
    const bucket = createBucket();
    const _id = v4();
    filename = `${process.env.DOMAIN_URL}/lbd/${id}/files/${_id}`;

    // const stream = bucket.createWriteStream({_id, filename: "test.gltf"})
    const readable = new Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(data);
    readable.push(null);
    const stream = bucket.writeFile({ filename}, readable);
    console.log('stream', stream)
    console.log('_id', _id)
    // const projectUrl = `${process.env.DOMAIN_URL}/lbd/${id}`;
    // const fileId = v4();
    // const file = ne File({
    //   main: data,
    //   project: projectUrl,
    //   id: fileId,
    // });

    // file.url = `${process.env.DOMAIN_URL}/lbd/${id}/files/${file.id}`;
    // await file.save();
    return (filename);
  } catch (error) {
    error.message = `Unable to upload document; ${error.message}`;
    throw error;
  }
}

async function deleteDocument(filename) {
  const bucket = createBucket()
  const doc = await bucket.findOne({filename})
  return new Promise((resolve, reject) => {
    bucket.deleteFile(doc._id, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve()
    });
  })
  // try {
  //   document = await File.findByIdAndDelete(id);
  //   if (!document) {
  //     throw new Error(`Document not found`);
  //   }
  //   return document.url;
  // } catch (error) {
  //   error.message = `Unable to delete document with id ${id}; ${error.message}`;
  //   throw error;
  // }
}

// ACL implemented
// updateProjectDoc = ({ projectId, body, user }) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let project = await Project.findOne({ _id: projectId })
//             if (!project) {
//                 reject({ status: 404 })
//             }

//             let updates = Object.keys(body)
//             console.log({ updates })
//             const allowedUpdates = ['projectUri']
//             let nonAllowedUpdates = updates.filter(x => !allowedUpdates.includes(x));
//             updates = updates.filter(x => allowedUpdates.includes(x));
//             updates.forEach((update) => project[update] = body[update])
//             await project.save()

//             resolve({ project, notPermitted: nonAllowedUpdates, status: 200 })
//         } catch (error) {
//             console.log('error', error)
//             reject(error)
//         }
//     })
// }

// ACL implemented
function getDocument(id, fileId) {
  return new Promise((resolve, reject) => {
    try {
      let file = ''
      const filename = `${process.env.DOMAIN_URL}/lbd/${id}/files/${fileId}`;
      console.log('filename', filename)
      const bucket = createBucket()
      const readStream = bucket.createReadStream({filename})
      readStream.on('data', (chunk) => {
        file += chunk.toString("base64");
      })
      readStream.on('end', () => {
        resolve(file)
      })
      // bucket.findOne({filename}, (err, content) => {
      //   if (err) {
      //     console.log('err.message', err.message)
      //     throw err
      //   }
      //   let buff
      //   const stream = content.read()
      //   stream.pipe(buff)
      //   stream.on('close', resolve(buff));
      //   })
      
      // const file = await File.findOne({ _id: fileId, project: projectUrl });
  
      // if (!file) {
      //   throw new Error(`Document not found`);
      // }
  
      // return file;
    } catch (error) {
      error.message = `Unable to get document with id ${id}; ${error.message}`;
      reject(error)
    }
  })
}

// only admin
// migrateMongo = () => {
//     return new Promise(async (resolve, reject) => {
//         try {

//             if (newBaseUri.endsWith("/")) {
//                 newBaseUri = newBaseUri.slice(0, -1);
//             }

//             let files = await File.find({})
//             const filePromises = files.map(async file => {
//                 const url = `${process.env.SERVER_URL}/project/${file.project._id}/files/${file._id}`
//                 file.url = url
//                 await file.save()
//                 return url
//             })

//             let projects = await Project.find({})
//             const projectPromises = projects.map(async project => {
//                 const url = `${newBaseUri}/project/${project._id}`
//                 project.url = url
//                 await project.save()
//                 return url
//             })

//             await Promise.all(filePromises)
//             await Promise.all(projectPromises)

//             resolve()

//         } catch (error) {
//             console.log('error', error)
//             reject(error)
//         }
//     })
// }

module.exports = {
  uploadDocument,
  deleteDocument,
  getDocument,
  deleteProjectDoc,
  createProjectDoc,
  pushProjectToCreator,
  deleteProjectFromUser,
  findAllProjectDocuments,
};
