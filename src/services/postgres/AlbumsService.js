const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const mapAlbumDBToModel = require('../../utils/mapAlbumDBToModel');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES ($1, $2, $3) RETURNING album_id',
      values: [id, name, year],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows[0].album_id) {
      throw new InvariantError('Failed adding new album');
    }

    return queryResult.rows[0].album_id;
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE album_id = $1',
      values: [id],
    };

    const albumQueryResult = await this._pool.query(albumQuery);

    if (!albumQueryResult.rows.length) {
      throw new NotFoundError('Album with specified id not found');
    }

    /**
     * TODO:
     * 1. Check for the songs in the album (query)
     * 2. Check if there are/no songs in the album (if-else)
     */

    /**
     * TODO:
     * use mapAlbumDBToModel() to map db column name
     * to match the expected property name
     * (map 'album_id' from db to 'albumId' in response)
     */
    return albumQueryResult.rows.map(mapAlbumDBToModel)[0];
  }

  async editAlbumById(id, { name, year }) {

    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE album_id = $3 RETURNING album_id',
      values: [name, year, id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Failed updating album. Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id',
      values: [id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows.length) {
      throw new NotFoundError('Failed deleting album. Id not found');
    }
  }
}

module.exports = AlbumsService;