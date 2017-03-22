/*
** Framework code courtesy of Cody Van Der Mark
** All the rest was coded by Jeannette Forbes
*/

//Take in our modules
const http = require('http');
const url = require('url');
const query = require('querystring');

//Take in our files
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// handle POST requests
const handlePost = (request, response, parsedUrl) => {
  const res = response;
  const body = [];

  // Throw a bad request on stream crapout
  request.on('error', (err) => {
    console.dir(err);
    res.statusCode = 400;
    res.end();
  });

  // Add each byte of data to byte array
  request.on('data', (chunk) => {
    body.push(chunk);
  });

  // on end of upload stream.
  request.on('end', () => {
    //Parse the request
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    //What do we do now?
    if(parsedUrl.pathname === '/addUser')
      jsonHandler.addUser(request, res, bodyParams);
    if(parsedUrl.pathname === '/addComment')
      jsonHandler.addComment(request, res, bodyParams);
    if(parsedUrl.pathname === '/changeColor')
      jsonHandler.changeColor(request, res, bodyParams);
    if(parsedUrl.pathname === '/changeIcon')
      jsonHandler.changeIcon(request, res, bodyParams);
  });
};

// handle GET requests
const handleGet = (request, response, parsedUrl) => {

  //What do we do with this request?
  if (parsedUrl.pathname === '/') {
    htmlHandler.getLogin(request, response);
  } else if (parsedUrl.pathname === '/login'){
    jsonHandler.validateUser(request, response);
  } else if (parsedUrl.pathname === '/style.css') {
    htmlHandler.getCSS(request, response);
  } else if (parsedUrl.pathname === '/getUsers') {
    jsonHandler.getUsers(request, response);
  } else if (parsedUrl.pathname === '/getComments') {
    jsonHandler.getComments(request, response);
  } else {
    jsonHandler.notFound(request, response);
  }

};

//WARNING: We should never get a HEAD request from the server!
const handleHead = (request, response, parsedUrl) => {
  jsonHandler.notFound(request, response);
}

//What kind of request is this, my man?
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  if (request.method === 'POST') {
    handlePost(request, response, parsedUrl);
  } else if(request.method === 'GET'){
    handleGet(request, response, parsedUrl);
  } else{
    handleHead(request, response, parsedUrl);
  }
};

//Make the thing
http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);
