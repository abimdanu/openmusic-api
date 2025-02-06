const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(
    playlistsService,
    songsService,
    validator
  ) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);

    const { name } = request.payload;
    const { userId } = request.auth.credentials;

    const playlistId = await this._playlistsService.addPlaylist({
      name,
      owner: userId,
    });

    return h.response({
      status: 'success',
      data: {
        playlistId,
      },
    }).code(201);
  }

  async getPlaylistsHandler(request) {
    const { userId } = request.auth.credentials;

    const playlists = await this._playlistsService.getPlaylists(userId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  };

  async deletePlaylistByIdHandler(request) {
    const { id: playlistId } = request.params;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);
    await this._playlistsService.deletePlaylistById(playlistId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, userId);
    await this._songsService.getSongById(songId);
    await this._playlistsService.addSongToPlaylist(playlistId, songId);
    await this._playlistsService.addPlaylistActivity(playlistId, songId, userId, 'add');

    return h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu ke playlist',
    }).code(201);
  }

  async getSongsInPlaylistHandler(request) {
    const { id: playlistId } = request.params;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, userId);

    const playlistWithSongs = await this._playlistsService.getSongsInPlaylist(playlistId);

    return {
      status: 'success',
      data: {
        playlist: playlistWithSongs,
      },
    };
  }

  async deleteSongFromPlaylistHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, userId);
    await this._playlistsService.deleteSongFromPlaylist(playlistId, songId);
    await this._playlistsService.addPlaylistActivity(playlistId, songId, userId, 'delete');

    return {
      status: 'success',
      message: 'Berhasil menghapus lagu dari playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: playlistId } = request.params;
    const { userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, userId);

    const activities = await this._playlistsService.getPlaylistActivities(playlistId);

    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
