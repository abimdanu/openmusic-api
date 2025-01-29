require('dotenv').config();

const Hapi = require('@hapi/hapi');

// Import for albums feature
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// Import for songs feature
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// Import for users feature
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();
  const usersService = new UsersService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    }
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      }
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      }
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      }
    }
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        return h.response({
          status: 'fail',
          message: response.message
        }).code(response.statusCode);
      }

      if (!response.isServer) {
        return h.continue;
      }

      return h.response({
        status: 'error',
        message: 'There was an internal server error'
      }).code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();
