const Hapi = require('@hapi/hapi');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    }
  });

  /**
   * TODO: register all plugins after done
   */
  // await server.register([
  //   {
  //     plugin: ,
  //     options: {
  //       service: ,
  //       validator: ,
  //     }
  //   },
  //   {
  //     plugin: ,
  //     options: {
  //       service: ,
  //       validator: ,
  //     }
  //   }
  // ]);

  /**
   * TODO: apply custom error when handling responses
   */
  // server.ext('onPreResponse', (request, h) => {
  //   const { response } = request;

  // });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init();