const { repoConfig } = require("../util/repoConfig");
const request = require("request");
const FormData = require("form-data");
var fs = require("fs");
const btoa = require("btoa-lite");
// create project repository docdb, get project_id
//const documentData = await docStore.createProjectDoc({ ...req.body, owner})

// create project repository graphdb
const axios = require("axios");

async function getRepositories () {
    try {
      const options = {
        method: "GET",
        url: `${process.env.GRAPHDB_URL}/rest/repositories`,
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(
            process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
          )}`,
        },
      };
      const response = await axios(options);
      return(response.data);
    } catch (error) {
        error.message = (`Failed to get repositories; ${error.message}`)
        throw error
    }
};

async function getRepository (id)  {
    try {
      const options = {
        method: "GET",
        url: `${process.env.GRAPHDB_URL}/rest/repositories/${id}`,
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(
            process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
          )}`,
        },
      };
      const response = await axios(options);
      return(response.data);
    } catch (error) {
        error.message = (`Failed to get repository; ${error.message}`)
        throw error
    }
};

async function createRepository(title, id) {
  try {
    let repoconfig = repoConfig(title, id);

    const formData = new FormData();

    formData.append("config", repoconfig, "config");
    const url = `${process.env.GRAPHDB_URL}/rest/repositories`;
    const headers = {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      Authorization: `Basic ${btoa(
        process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
      )}`,
    };

    const response = await axios.post(url, formData, { headers });
    console.info(`Created repository with id ${id}`)
    return(response.data);
  } catch (error) {
      error.message = (`Failed creating repository; ${error.message}`)
      throw error
  }
}

async function deleteRepository(id) {
    try {
      const options = {
        method: "DELETE",
        url: `${process.env.GRAPHDB_URL}/rest/repositories/${id}`,
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(
            process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
          )}`,
        },
      };
      const response = await axios(options);
      return(response.data);
    } catch (error) {
        error.message = (`Failed deleting repository; ${error.message}`)
        throw error
    }
};

module.exports = {
  getRepositories,
  getRepository,
  createRepository,
  deleteRepository,
};
