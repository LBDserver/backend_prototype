const jwt = require("jsonwebtoken");
const { basicPermissions } = require("./authorisation/basicPermissions");
const User = require("../projectApi/documentApi/mongodb/models/UserModel");
const Project = require("../projectApi/documentApi/mongodb/models/ProjectModel");

authenticate = async (req, res, next) => {
  try {
    let user;
    if (req.header("Authorization")) {
      const token = req.header("Authorization").replace("Bearer ", "");
      req.token = token;
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      user = await User.findOne({ _id: decoded._id, "tokens.token": token });
    } else {
      console.log("no authentication: user is foaf:Agent");
      user = { username: "visitor", guest: true };
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate" });
  }
};

authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!user) {
      throw new Error();
    }

    if (user.email === "admin@lbdserver.org") {
      req.user = user;
      req.token = token;
      next();
    } else {
      throw new Error();
    }
  } catch (error) {
    res
      .status(401)
      .send({ error: "Admin rights are required to access this endpoint" });
  }
};

checkAccess = async (req, res, next) => {
  console.log("checking access");
  try {
    const { allowed, query } = await basicPermissions(req);
    if (req.query.query && query) {
      console.log("req.query.query", req.query.query);
      console.log("query", query);
      req.query.query = query;
    }
    req.permissions = allowed;
    console.log("allowed", allowed);
    next();
  } catch (error) {
    console.log("error", error);
    try {
      return res.status(error.status).send({ error: error.reason });
    } catch (err) {
      return res.status(500).send({ error: error });
    }
  }
};

module.exports = { authenticate, authenticateAdmin, checkAccess };
