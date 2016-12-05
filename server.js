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
}

const server = new Hapi.Server();

server.connection({
  port: 8080,
  host: 'localhost'
})

server.register([Inert, cookie], (err) => {
  if (err) throw err;

  server.auth.strategy('base', 'cookie', options);

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
      request.post({url: 'https://github.com/login/oauth/access_token', form: post},
       (err, httpResponse, body) => {
         const token = QueryString.parse(body).access_token;
         req.cookieAuth.set({access_token: token});
          rep.redirect('/anything');
      })
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
      if(req.auth.isAuthenticated) {
        request.get({
          url: 'https://api.github.com/user',
          headers: {
            'User-Agent': 'Test Oauth',
            Authorization: `token ${req.auth.credentials.access_token}`
          }
        }, (err, httpResponse, body) => {
            if (err) console.log(err);
            const parsed = JSON.parse(body)
            console.log(parsed)
            rep(`Hello ${parsed.name}, you live in ${(parsed.location || 'somewhere')},
            <img src='${parsed.avatar_url}'/>
            `);
          }

        )
      }
    }
  }
])
});

server.start((err)=>{
  if (err) throw err;
  console.log('Server started at port: 8080');
})
