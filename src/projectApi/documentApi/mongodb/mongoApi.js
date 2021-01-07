const { Project, File } = require("./models");
const { checkPermissions } = require("../../../authApi");
const { v4 } = require("uuid");

function createProjectDoc(url, _id) {
  return new Promise(async (resolve, reject) => {
    try {
      const project = new Project({ url, _id });
      await project.save();
      resolve(project);
    } catch (error) {
      console.log("error", error);
      reject(error);
    }
  });
}

function deleteProjectDoc (id) {
    return new Promise(async (resolve, reject) => {
      try {
        await Project.findByIdAndDelete(id);
        resolve();
      } catch (error) {
        console.log("error", error);
        reject(error);
      }
    });
  };

function pushProjectToCreator(id, creator) {
  return new Promise(async (resolve, reject) => {
    try {
      creator.projects.push(id);
      await creator.save();
    } catch (error) {
      reject(error);
    }
  });
}

function removeProjectFromUser(id, user) {
    return new Promise(async (resolve, reject) => {
      try {
        let newProjectList = user.projects.filter((project) => {
            return project !== id;
          });
          user.projects = newProjectList;
          await user.save();
          resolve()
      } catch (error) {
        reject(error);
      }
    });
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



// owned by current user
uploadDocuments = (projectName, data, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const projectUrl = `${process.env.DOMAIN_URL}/lbd/${projectName}`;
      const fileId = v4();
      const file = new File({
        main: data,
        project: projectUrl,
        id: fileId,
      });

      file.url = `${process.env.DOMAIN_URL}/lbd/${projectName}/files/${file.id}`;
      await file.save();
      resolve(file.url);
    } catch (error) {
      console.log("error", error);
      reject({ reason: `MongoDB error: ${error.message}`, status: 500 });
    }
  });
};

// only owner-permitted
deleteDocument = (fileId) => {
  return new Promise(async (resolve, reject) => {
    try {
      document = await File.findByIdAndDelete(fileId);
      if (!document) {
        throw new Error();
      }
      resolve(document.url);
    } catch (error) {
      reject({ reason: `MongoDB error: ${error.message}`, status: 500 });
    }
  });
};

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
getDocument = async (projectName, fileId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const projectUrl = `${process.env.DOMAIN_URL}/lbd/${projectName}`;
      const file = await File.findOne({ _id: fileId, project: projectUrl });

      if (!file) {
        reject({ status: 404, message: "File not found" });
      }

      resolve(file);
    } catch (error) {
      reject({ reason: `MongoDB error: ${error.message}`, status: 500 });
    }
  });
};

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
  uploadDocuments,
  deleteDocument,
  getDocument,
  deleteProjectDoc,
  createProjectDoc,
  pushProjectToCreator,
  removeProjectFromUser
};
