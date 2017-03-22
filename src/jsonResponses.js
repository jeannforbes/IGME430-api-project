const htmlHandler = require('./htmlResponses.js');

const crypto = require('crypto');

const users = {};
const comments = {
  all:[],
};

let etag = crypto.createHash('sha1').update(JSON.stringify(users));
let digest = etag.digest('hex');

// function to respond with a json object
// takes request, response, status code and object to send
const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

// function to respond without json body
// takes request, response and status code
const respondJSONMeta = (request, response, status) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.end();
};

// return user object as JSON
const getUsers = (request, response) => {
  const responseJSON = {
    users,
  };

  if (request.headers['if-none-match'] === digest) {
    return respondJSON(request, response, 304, responseJSON);
  }
  return respondJSON(request, response, 200, responseJSON);
};

// function to add a user from a POST body
const addUser = (request, response, body) => {
  // default json message
  const responseJSON = {
    message: 'Name and password are both required.',
  };

  if (!body.user || !body.pass) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  // default status code to 201 created
  let responseCode = 201;

  // if that user's name already exists in our object
  // then switch to a 204 updated status
  if (users[body.user]) {
    responseCode = 204;
  } else {
    // otherwise create an object with that name
    users[body.user] = {};

    etag = crypto.createHash('sha1').update(JSON.stringify(users));
    digest = etag.digest('hex');
  }

  // add or update fields for this user name
  users[body.user].user = body.user;
  users[body.user].pass = body.pass;

  // if response is created, then set our created message
  // and sent response with a message
  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

const notFound = (request, response) => {
  const responseJSON = {
    id: 'notFound',
    message: 'The page you are looking for was not found.',
  };
  return respondJSON(request, response, 404, responseJSON);
};

const validateUser = (request, response) => {
  if(!request.url.includes("user=") || !request.url.includes("pass="))
    return htmlHandler.getLogin(request, response);
  const user = request.url.split("=")[1].split("&")[0];
  const pass = request.url.split("=")[2];

  console.log(users);
  if(users[user]){
    if(users[user].user == user && users[user].pass == pass)
      console.log("Logging in user "+user);
      htmlHandler.getIndex(request, response);
  } else{
    console.log("Invalid login for "+user);
    htmlHandler.getLogin(request, response);
  }
};

const addComment = (request, response, body) => {
  // default json message
  const responseJSON = {
    message: 'Write something first!',
  };

  if (!body.message) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }
  if (!body.user || body.user=="") {
    body.user = "Anonymous";
  }

  // default status code to 201 created
  let responseCode = 201;

  var newComment = {};

  etag = crypto.createHash('sha1').update(JSON.stringify(comments));
  digest = etag.digest('hex');

  // add or update fields for this user name
  newComment.user = body.user;
  newComment.message = body.message;

  comments.all.push(newComment);

  // if response is created, then set our created message
  // and sent response with a message
  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

const getComments = (request, response) => {
  const responseJSON = {
    comments,
  };

  if (request.headers['if-none-match'] === digest) {
    return respondJSON(request, response, 304, responseJSON);
  }
  return respondJSON(request, response, 200, responseJSON);
};

// public exports
module.exports = {
  getUsers,
  addUser,
  notFound,
  validateUser,
  addComment,
  getComments,
};
