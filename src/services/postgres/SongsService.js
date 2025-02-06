const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const mapSongDBToModel = require('../../utils/mapSongDBToModel');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    const songId = `song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO songs VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING song_id',
      values: [songId, title, year, performer, genre, duration, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Gagal menambahkan lagu');
    }

    await this._cacheService.delete(`albums:${albumId}`);
    return queryResult.rows[0].song_id;
  }

  async getSongs(title = '', performer = '') {
    const query = {
      text: 'SELECT song_id AS id, title, performer FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
      values: [`%${title}%`, `%${performer}%`],
    };

    const queryResult = await this._pool.query(query);

    return queryResult.rows;
  }

  async getSongById(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE song_id = $1',
      values: [songId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return mapSongDBToModel(queryResult.rows[0]);
  }

  async editSongById(songId, { title, year, performer, genre, duration }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5 WHERE song_id = $6 RETURNING song_id',
      values: [title, year, performer, genre, duration, songId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    const albumQuery = {
      text: 'SELECT album_id FROM songs WHERE song_id = $1',
      values: [songId],
    };

    const albumQueryResult = await this._pool.query(albumQuery);

    await this._cacheService.delete(`albums:${albumQueryResult.rows[0].album_id}`);
  }

  async deleteSongById(songId) {
    const albumQuery = {
      text: 'SELECT album_id FROM songs WHERE song_id = $1',
      values: [songId],
    };

    const albumQueryResult = await this._pool.query(albumQuery);

    const query = {
      text: 'DELETE FROM songs WHERE song_id = $1 RETURNING song_id',
      values: [songId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
    }

    await this._cacheService.delete(`albums:${albumQueryResult.rows[0].album_id}`);
  }
}

module.exports = SongsService;
