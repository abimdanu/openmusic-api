class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);

    const { title, year, performer, genre, duration } = request.payload;
    const songId = await this._service.addSong({ title, year, performer, genre, duration });

    return h.response({
      status: 'success',
      message: 'Song added successfully',
      data: {
        songId,
      }
    }).code(201);
  }

  async getSongsHandler(request) {
    const { title = '', performer = '' } = request.query;
    const songs = await this._service.getSongs(title, performer);

    return {
      status: 'success',
      data: {
        songs,
      }
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);

    return {
      status: 'success',
      data: {
        song,
      }
    };
  }

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);

    const { id } = request.params;
    const { title, year, performer, genre, duration } = request.payload;
    await this._service.editSongById(id, { title, year, performer, genre, duration });

    return {
      status: 'success',
      message: 'Song updated successfully',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;

    await this._service.deleteSongById(id);

    return {
      status: 'success',
      message: 'Song deleted successfully',
    };
  }
}

module.exports = SongsHandler;