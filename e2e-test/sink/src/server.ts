import fastify from 'fastify'
import minimist from 'minimist'
import N3, { Quad } from 'n3';

const server = fastify();
const args = minimist(process.argv.slice(2));
const silent: boolean = args.silent !== undefined;
if (!silent) {
  console.debug("Arguments: ", args);
}

const port = args.port || 8080;
const host = args.host || 'localhost';

const members: string[] = [];

server.addHook('onRequest', (request, _reply, done) => {
  if (!silent) {
    console.debug(`${request.method} ${request.url}`);
  }
  done();
});

server.get('/', async (_request, reply) => {
  reply.send({count: members.length});
});

server.get('/member', async (_request, reply) => {
  reply.send(members);
});

server.addContentTypeParser('application/n-quads', { parseAs: 'string' }, function (request, body, done) {
  try {
    const parser = new N3.Parser({ format: 'N-Quads' });
    done(null, parser.parse(body as string))
  } catch (error: any) {
    error.statusCode = 400
    done(error, undefined)
  }
})

server.post('/member', async (request, reply) => {
  const quads = request.body as Quad[];
  const member = quads.filter(x => x.predicate.value === 'https://w3id.org/tree#member').shift();

  if (member === undefined) {
    reply.statusCode = 422;
  }
  else {
    members.push(member.object.value);
    reply.statusCode = 201;
  }

  reply.send('');
});

async function closeGracefully(signal: any) {
  if (!silent) {
    console.debug(`Received signal: `, signal);
  }
  await server.close();
  process.exitCode = 0;
}

process.on('SIGINT', closeGracefully);

const options = { port: port, host: host };
server.listen(options, async (err: any, address: string) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (!silent) {
    console.debug(`Sink listening at ${address}`);
  }
});
