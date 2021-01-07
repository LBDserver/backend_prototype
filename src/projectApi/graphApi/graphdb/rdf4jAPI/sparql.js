const { repoConfig } = require("../util/repoConfig");
const FormData = require("form-data");
var fs = require("fs");
const errorHandlerAxios = require("../../../../util/errorHandlerAxios");
const btoa = require("btoa-lite");

const axios = require("axios");

async function queryRepository(id, query) {
  try {
    const options = {
      method: "GET",
      url: `${process.env.GRAPHDB_URL}/repositories/${id}?query=${query}`,
      headers: {
        Accept: "application/sparql-results+json",
        Authorization: `Basic ${btoa(
          process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
        )}`,
      },
    };
    const results = await axios(options);
    return results.data;
  } catch (error) {
    throw new Error(
      `Unable to query repostory with id ${id}; ${error.message}`
    );
  }
}

// baseURI not yet implemented, though supported by REST API of graphdb
async function updateRepositorySparql(id, update) {
  try {
    const options = {
      method: "POST",
      url: `${process.env.GRAPHDB_URL}/repositories/${id}/statements?update=${update}`,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(
          process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
        )}`,
      },
    };
    response = await axios(options);
    return response.data;
  } catch (error) {
    throw new Error(
      `Unable to update repository with id ${id}; ${error.message}`
    );
  }
}

module.exports = {
  queryRepository,
  updateRepositorySparql,
};
