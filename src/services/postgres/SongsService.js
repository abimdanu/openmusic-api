const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const mapSongDBToModel = require('../../utils/mapSongDBToModel');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    const id = `song-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO songs VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING song_id',
      values: [id, title, year, performer, genre, duration, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new InvariantError('Failed adding new song');
    }

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

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE song_id = $1',
      values: [id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Song with specified id not found');
    }

    return queryResult.rows.map(mapSongDBToModel)[0];
  }

  async editSongById(id, { title, year, performer, genre, duration }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5 WHERE song_id = $6 RETURNING song_id',
      values: [title, year, performer, genre, duration, id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Failed updating song. Id not found');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE song_id = $1 RETURNING song_id',
      values: [id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Failed deleting song. Id not found');
    }
  }
}

module.exports = SongsService;