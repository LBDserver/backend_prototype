const defaultBody = require("../util/createGraphBody");
const axios = require("axios");
const FormData = require("form-data");
const errorHandlerAxios = require("../../../../util/errorHandlerAxios");
const btoa = require("btoa-lite");
const parse = require("@frogcat/ttl2jsonld").parse

async function createNamedGraph(repositoryId,{ context, baseURI, data },token) {
  try {
    const body = JSON.stringify(defaultBody(context, baseURI, data));
    const url = `${process.env.GRAPHDB_URL}/rest/data/import/upload/${repositoryId}/text`
    console.log('url', url)
    const options = {
      method: "post",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(
          process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
        )}`,
      },
      data: body,
    };

    const response = await axios(options);
    console.info(`Created named graph ${context}`)
    return parse(data);
  } catch (error) {
    error.message = (
      `Failed to create named graph ${context}; ${error.message}`
    );
    throw error
  }
}

async function getNamedGraph(namedGraph, repositoryId, token, format) {
  try {
    // const mimeTypes = {
    //   turtle: "text/turtle",
    //   jsonld: "application/ld+json"
    // };

    // const mimeType = mimeTypes[format];

    var options = {
      method: "GET",
      url: `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs/service?graph=${namedGraph}\n`,
      headers: {
        Accept: `text/turtle`,
        Authorization: `Basic ${btoa(
          process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
        )}`,
      },
    };

    const response = await axios(options);
    if (format === "text/turtle") {
      return response.data
    } else {
      return parse(response.data)
    }
  } catch (error) {
    error.message = (
      `Error fetching named graph ${namedGraph}; ${error.message}`
    );
    throw error
  }
}

async function deleteNamedGraph(namedGraph, repositoryId, token) {
  try {
    const formData = new FormData();
    console.log("clearing Graph ", namedGraph);
    formData.append("update", `CLEAR GRAPH <${namedGraph}>`);
    const url = `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/statements`;
    const headers = {
      Authorization: `Basic ${btoa(
        process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
      )}`,
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
    };
    const response = await axios.post(url, formData, { headers });
    return response.data;
  } catch (error) {
    error.message = (
      `Failed to delete named graph ${namedGraph}; ${error.message}`
    );
    throw error
  }
}

async function getAllNamedGraphs(repositoryId, token) {
  try {
    const options = {
      method: "GET",
      url: `${process.env.GRAPHDB_URL}/repositories/${repositoryId}/rdf-graphs`,
      headers: {
        Authorization: `Basic ${btoa(
          process.env.GDB_ADMIN + ":" + process.env.GDB_ADMIN_PW
        )}`,
      },
    };
    const response = await axios(options);
    return response.data;
  } catch (error) {
    error.message = (`Error fetching  all named Graphs; ${error.message}`);
    throw error
  }
}

module.exports = {
  createNamedGraph,
  deleteNamedGraph,
  getNamedGraph,
  getAllNamedGraphs,
};
