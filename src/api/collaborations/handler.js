const autoBind = require('auto-bind');

class CollaborationsHandler {
  constructor(
    collaborationsService,
    playlistsService,
    usersService,
    validator,
  ) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._usersService = usersService;
    this._validator = validator;

    autoBind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);

    const { playlistId, userId: collaboratorId } = request.payload;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);
    await this._usersService.getUserById(collaboratorId);

    const collaborationId = await this._collaborationsService.addCollaboration(playlistId, collaboratorId);

    return h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    }).code(201);
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborationPayload(request.payload);

    const { playlistId, userId: collaboratorId } = request.payload;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

    await this._collaborationsService.deleteCollaboration(playlistId, collaboratorId);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
