const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

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

    if (!queryResult.rows[0].id) {
      throw new InvariantError('Failed adding new album.');
    }

    return queryResult.rows[0].id;
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE album_id = $1',
      values: [id],
    };

    const albumQueryResult = await this._pool.query(albumQuery);

    if (!albumQueryResult.rows.length) {
      throw new InvariantError('Album with specified id not found.');
    }

    /**
     * TODO:
     * create a mapper util to map db column name
     * to match the expected property name
     * (map 'album_id' from db to 'albumId' in response)
     */
    return albumQueryResult.rows[0];
  }

  /**
   * TODO: implement editAlbumById()
   */

  /**
   * TODO: implement deleteAlbumById()
   */
}

module.exports = AlbumsService;