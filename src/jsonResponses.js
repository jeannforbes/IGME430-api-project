const htmlHandler = require('./htmlResponses.js');

const crypto = require('crypto');

const users = {};
const comments = {
  all:[],
};

const defaultIcons = [
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-grin-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-glasses-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-wink-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-devilish-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-angel-128.png",];

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
  users[body.user].icon = defaultIcons[parseInt(Math.random()*defaultIcons.length)];

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
  if(!request.url.includes("user=") || !request.url.includes("pass=")){
    htmlHandler.getInvalidLogin(request, response);
    return;
  }
  const user = request.url.split("=")[1].split("&")[0];
  const pass = request.url.split("=")[2];

  if(users[user]){
    if(users[user].user == user && users[user].pass == pass)
      htmlHandler.getIndex(request, response);
      return;
  }
  htmlHandler.getInvalidLogin(request, response);
  return;
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
  newComment.color = body.color;
  newComment.icon = users[body.user].icon;

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

const changeColor = (request, response, body) => {
  etag = crypto.createHash('sha1').update(JSON.stringify(comments));
  digest = etag.digest('hex');

  if (!body.color || !body.user) {
    return respondJSONMeta(request, response, 400);
  }

  // default status code to 201 created
  let responseCode = 201;

  // change this user's comment color
  for(var i=0; i<comments.all.length; i++){
    if(comments.all[i].user == body.user)
      comments.all[i].color = body.color;
  }

  return respondJSONMeta(request, response, responseCode);
};

const changeIcon = (request, response, body) => {
  etag = crypto.createHash('sha1').update(JSON.stringify(comments));
  digest = etag.digest('hex');

  if (!body.icon || !body.user) {
    return respondJSONMeta(request, response, 400);
  }

  // default status code to 201 created
  let responseCode = 201;

  users[body.user].icon = body.icon;

  // change this user's comment color
  for(var i=0; i<comments.all.length; i++){
    if(comments.all[i].user == body.user)
      comments.all[i].icon = body.icon;
  }

  return respondJSONMeta(request, response, responseCode);
}

// public exports
module.exports = {
  getUsers,
  addUser,
  notFound,
  validateUser,
  addComment,
  getComments,
  changeColor,
  changeIcon,
};
