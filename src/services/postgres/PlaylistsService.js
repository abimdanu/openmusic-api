const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService {
  constructor(collaborationsService) {
    this._pool = new Pool();

    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING playlist_id',
      values: [id, name, owner],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Gagal menambahkan playlist');
    }

    return queryResult.rows[0].playlist_id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `SELECT p.playlist_id AS id, p.name, u.username
      FROM playlists p
      LEFT JOIN users u
      ON p.owner = u.user_id
      LEFT JOIN collaborations c
      ON p.playlist_id = c.playlist_id
      WHERE owner = $1 OR c.user_id = $1`,
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
      throw new NotFoundError('Gagal menghapus playlist. Id tidak ditemukan');
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
      throw new InvariantError('Gagal menambahkan lagu ke playlist');
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
      throw new NotFoundError('Gagal mendapatkan detail playlist. Playlist tidak ditemukan');
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
      throw new InvariantError('Gagal menghapus lagu dari playlist');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE playlist_id = $1',
      values: [playlistId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = queryResult.rows[0];

    if (playlist.owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async addPlaylistActivity(playlistId, songId, userId, action) {
    const activityId = `activity-${nanoid(16)}`;
    const currentTime = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING activity_id',
      values: [activityId, playlistId, songId, userId, action, currentTime],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Gagal menambahkan aktivitas');
    }
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT u.username, s.title, a.action, a.time
      FROM playlist_song_activities a
      LEFT JOIN users u
      ON a.user_id = u.user_id
      LEFT JOIN songs s
      ON a.song_id = s.song_id
      WHERE a.playlist_id = $1`,
      values: [playlistId],
    };

    const queryResult = await this._pool.query(query);

    return queryResult.rows;
  }
}

module.exports = PlaylistsService;
