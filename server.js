const Hapi = require('hapi');
const Inert = require('inert');
const QueryString = require('querystring');
const env = require('env2')('./config.env');
const request = require('request');
const cookie = require('hapi-auth-cookie');

const options = {
  password: 'anythinganythinganythinganythinganythinganythinganythinganythinganythinganythinganything',
  cookie: 'somecookie',
  ttl: 24 * 60 * 60 * 1000,
  isSecure: false,
  isHttpOnly: false
};

const server = new Hapi.Server();

server.connection({
  port: 8080,
  host: 'localhost'
});

server.register([Inert, cookie], (err) => {
  if (err) throw err;

  server.auth.strategy('base', 'cookie', options);

  server.route([{
    path: '/',
    method: 'GET',
    handler: (req, rep) => {
      rep.file('./index.html');
    }
  },
  {
    path: '/login',
    method: 'GET',
    handler: (req, rep) => {
      const baseURL = 'https://facebook.com/v2.8/dialog/oauth';
      const queries = QueryString.stringify({client_id: process.env.CLIENT_ID, redirect_uri: 'http://localhost:8080/welcome'});
      rep.redirect(`${baseURL}?${queries}`);
    }
  },
  {
    path: '/welcome',
    method: 'GET',
    handler: (req, rep) => {
      const cI = process.env.CLIENT_ID;
      const cS = process.env.CLIENT_SECRET;
      const rd = 'http://localhost:8080/welcome';
      const code = req.query.code;
      request.get(`https://graph.facebook.com/v2.8/oauth/access_token?client_id=${cI}&redirect_uri=${rd}&client_secret=${cS}&code=${code}`,
       (err, httpResponse, body) => {
         if (err) throw err;
         const token = JSON.parse(body).access_token;
         req.cookieAuth.set({access_token: token});
         rep.redirect('/anything');
       });
    }
  },
  {
    path: '/anything',
    method: 'GET',
    config: {
      auth: {
        mode: 'try',
        strategy: 'base'
      }
    },
    handler: (req, rep) => {
      if (req.auth.isAuthenticated) {
        request.get(`https://graph.facebook.com/me?access_token=${req.auth.credentials.access_token}`,
          (err, httpResponse, body) => {
            if (err) throw err;
            rep(`Welcome ${JSON.parse(body).name}!`);
          });
      }
    }
  }
  ]);
});

server.start((err) => {
  if (err) throw err;
  console.log('Server started at port: 8080');
});
