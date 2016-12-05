const Hapi = require('hapi');
const Inert = require('inert');
const QueryString = require('querystring');
const env = require('env2')('./config.env');
const request = require('request');

const server = new Hapi.Server();

server.connection({
  port: 8080,
  host: 'localhost'
})

server.register(Inert, (err) => {
  if (err) throw err;

  server.route([{
    path: '/',
    method: 'GET',
    handler: (req, rep) => {
      rep.file('./index.html')
    }
  },
  {
    path: '/login',
    method: 'GET',
    handler: (req, rep) => {
      const baseURL = 'https://github.com/login/oauth/authorize'
      const queries = QueryString.stringify({ client_id: process.env.CLIENT_ID, redirect_uri: 'http://localhost:8080/welcome'});
      rep.redirect(`${baseURL}?${queries}`);
    }
  },
  {
    path: '/welcome',
    method: 'GET',
    handler: (req, rep) => {
      const post = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.query.code
      }
      request.post('https://github.com/login/oauth/access_token', form: post, function(err,httpResponse,body){ /* ... */ })
    }
  }
])
});

server.start((err)=>{
  if (err) throw err;
  console.log('Server started at port: 8080');
})
