const Hapi = require('hapi');
const Inert = require('inert');

const server = new Hapi.Server();

server.connection({
  port: 8080,
  host: 'localhost'
})

server.register(Inert, (err) => {
  if (err) throw err;

  server.route({
    path: '/',
    method: 'GET',
    handler: (req, rep) => {
      rep.file('./index.html')
    }
  })
});

server.start((err)=>{
  if (err) throw err;
  console.log('Server started at port: 8080');
})
