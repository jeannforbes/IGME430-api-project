const fs = require('fs');  // pull in the file system module

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const login = fs.readFileSync(`${__dirname}/../client/login.html`);
const invalidLogin = fs.readFileSync(`${__dirname}/../client/invalidLogin.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);

const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const getLogin = (request, response) => {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(login);
	response.end();
}

const getInvalidLogin = (request, response) => {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(invalidLogin);
	response.end();
}

const getCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

module.exports = {
  getIndex,
  getLogin,
  getInvalidLogin,
  getCSS,
};
