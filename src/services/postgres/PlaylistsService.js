const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING playlist_id',
      values: [id, name, owner],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Failed adding new playlist');
    }

    return queryResult.rows[0].playlist_id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `SELECT p.playlist_id AS id, p.name, u.username
      FROM playlists p
      LEFT JOIN users u
      ON p.owner = u.user_id
      WHERE owner = $1`,
      values: [userId],
    };

    const queryResult = await this._pool.query(query);

    return queryResult.rows;
  }

  async deletePlaylistById(playlistId) {
    const query = {
      text: 'DELETE FROM playlists WHERE playlist_id = $1 RETURNING playlist_id',
      values: [playlistId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed deleting playlist (playlist not found)');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const playlistSongId = `psong-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING playlist_song_id AS id',
      values: [playlistSongId, playlistId, songId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Failed adding song to playlist');
    }

    return queryResult.rows[0].playlist_song_id;
  }

  async getSongsInPlaylist(playlistId) {
    const playlistQuery = {
      text: `SELECT p.playlist_id AS id, p.name, u.username
      FROM playlists p
      LEFT JOIN users u
      ON p.owner = u.user_id
      WHERE playlist_id = $1`,
      values: [playlistId],
    };

    const playlistQueryResult = await this._pool.query(playlistQuery);

    if (!playlistQueryResult.rowCount) {
      throw new NotFoundError('Failed getting songs in playlist (playlist not found)');
    }

    const songQuery = {
      text: `SELECT s.song_id AS id, s.title, s.performer
      FROM songs s
      LEFT JOIN playlist_songs ps
      ON s.song_id = ps.song_id
      WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const songQueryResult = await this._pool.query(songQuery);

    if (!songQueryResult.rowCount) {
      return {
        ...playlistQueryResult.rows[0],
        songs: [],
      };
    }

    return {
      ...playlistQueryResult.rows[0],
      songs: songQueryResult.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING playlist_song_id',
      values: [playlistId, songId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Failed deleting song from playlist');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE playlist_id = $1',
      values: [playlistId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Playlist with specified id not found');
    }

    const playlist = queryResult.rows[0];

    if (playlist.owner !== userId) {
      throw new AuthorizationError('Only the owner can access this playlist');
    }
  }
}

module.exports = PlaylistsService;
