const htmlHandler = require('./htmlResponses.js');
const crypto = require('crypto');

//The users!  Woohoo!
const users = {};
const comments = {
  all:[],
};

//Just a bunch of new user icons from the Tango Icon Library
const defaultIcons = [
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-grin-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-glasses-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-wink-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-devilish-128.png",
"https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/face-angel-128.png",];

//How else will we know if something is new?
let etag = crypto.createHash('sha1').update(JSON.stringify(users));
let digest = etag.digest('hex');

// Responds with a JSON object
const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

// Responds without the JSON body
const respondJSONMeta = (request, response, status) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.end();
};

// Returns users
const getUsers = (request, response) => {
  const responseJSON = {
    users,
  };

  // Handle response if content not modified
  if (request.headers['if-none-match'] === digest) {
    return respondJSON(request, response, 304, responseJSON);
  }
  return respondJSON(request, response, 200, responseJSON);
};

// Adds a user from a POST request
const addUser = (request, response, body) => {
  // default json message
  const responseJSON = {
    message: 'Name and password are both required.',
  };

  if (!body.user || !body.pass) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  // Defaults to 201
  let responseCode = 201;

  // Handle 204 if user already exists
  if (users[body.user]) {
    responseCode = 204;
    responseJSON.message = "That account already exists.";
  } else {
    // Make an empty user
    users[body.user] = {};

    etag = crypto.createHash('sha1').update(JSON.stringify(users));
    digest = etag.digest('hex');

    // Adds a user
    users[body.user].user = body.user;
    users[body.user].pass = body.pass;
    users[body.user].icon = defaultIcons[parseInt(Math.random()*defaultIcons.length)];
  }

  // Handles 201 response code
  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

// Handles an infinite number of potential nonexistent requests.
const notFound = (request, response) => {
  const responseJSON = {
    id: 'notFound',
    message: 'The page you are looking for was not found.',
  };
  return respondJSON(request, response, 404, responseJSON);
};

// Makes sure a user is valid before letting them login
const validateUser = (request, response) => {
  if(!request.url.includes("user=") || !request.url.includes("pass=")){
    htmlHandler.getInvalidLogin(request, response);
    return;
  }
  const user = request.url.split("=")[1].split("&")[0];
  const pass = request.url.split("=")[2];

  if(users[user]){
    console.log("user found");
    if(users[user].user === user && users[user].pass === pass){
      console.log(user+ ", "+pass);
      htmlHandler.getIndex(request, response);
      return;
    }
  }
  htmlHandler.getInvalidLogin(request, response);
  return;
};

// Adds a new comment by a user
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

  //Handle 201 response code
  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

// Gets all the stored comments for the client
const getComments = (request, response) => {
  const responseJSON = {
    comments,
  };

  if (request.headers['if-none-match'] === digest) {
    return respondJSON(request, response, 304, responseJSON);
  }

  return respondJSON(request, response, 200, responseJSON);
};

// Changes the user's comment color and updates their previous comments
const changeColor = (request, response, body) => {
  let responseCode = 500;

  etag = crypto.createHash('sha1').update(JSON.stringify(comments));
  digest = etag.digest('hex');

  if (!body.color || !body.user) {
    return respondJSONMeta(request, response, 400);
  }

  // We can relax about that 500 error
  responseCode = 201;

  // change this user's comment color
  for(var i=0; i<comments.all.length; i++){
    if(comments.all[i].user == body.user)
      comments.all[i].color = body.color;
  }

  return respondJSONMeta(request, response, responseCode);
};

// Changes the user's icon and updates their previous comments
const changeIcon = (request, response, body) => {
  let responseCode = 500;

  etag = crypto.createHash('sha1').update(JSON.stringify(comments));
  digest = etag.digest('hex');

  if (!body.icon || !body.user) {
    return respondJSONMeta(request, response, 400);
  }

  // We can relax - there's no 500 error on the horizon
  responseCode = 201;

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
