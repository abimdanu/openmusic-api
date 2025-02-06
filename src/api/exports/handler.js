const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(
    playlistsService,
    producerService,
    validator
  ) {
    this._playlistsService = playlistsService;
    this._producerService = producerService;
    this._validator = validator;

    autoBind(this);
  }

  async postExportPlaylistByIdHandler(request, h) {
    this._validator.validateExportPayload(request.payload);

    const { playlistId } = request.params;
    const { targetEmail } = request.payload;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

    const message = {
      playlistId,
      targetEmail,
    };

    await this._producerService.sendMessage('export:playlists', JSON.stringify(message));

    return h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    }).code(201);
  }
}

module.exports = ExportsHandler;
