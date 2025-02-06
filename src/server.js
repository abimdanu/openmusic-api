require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

// Import for albums feature
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// Import for album cover feature
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// Import for songs feature
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// Import for users feature
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// Import for authentications feature
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

// Import for playlists feature
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// Import for collaborations feature
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// Import for exports feature
const playlistExports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// Import for cache feature
const CacheService = require('./services/redis/CacheService');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const cacheService = new CacheService();
  const albumsService = new AlbumsService(cacheService);
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const songsService = new SongsService(cacheService);
  const storageService = new StorageService(path.resolve(__dirname, './api/albums/file/images'));
  const usersService = new UsersService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    debug: {
      request:['error'],
    },
    routes: {
      cors: {
        origin: ['*'],
      },
    }
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        userId: artifacts.decoded.payload.userId,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        storageService,
        albumsValidator: AlbumsValidator,
        uploadsValidator: UploadsValidator,
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
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      }
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        songsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: playlistExports,
      options: {
        playlistsService,
        producerService: ProducerService,
        validator: ExportsValidator,
      }
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      console.error(response);

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
  console.log(`Server is running on ${server.info.uri}`);
};

init();
