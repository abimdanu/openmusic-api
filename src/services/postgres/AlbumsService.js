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

    if (!albumQueryResult.rowCount) {
      throw new NotFoundError('Album with specified id not found');
    }

    const songsQuery = {
      text: 'SELECT song_id AS id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const songsQueryResult = await this._pool.query(songsQuery);

    if (!songsQueryResult.rowCount) {
      return { ...albumQueryResult.rows.map(mapAlbumDBToModel)[0], songs: [] };
    }

    return { ...albumQueryResult.rows.map(mapAlbumDBToModel)[0], songs: songsQueryResult.rows };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE album_id = $3 RETURNING album_id',
      values: [name, year, id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed updating album. Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id',
      values: [id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed deleting album. Id not found');
    }
  }

  async editAlbumCover(id, fileUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE album_id = $2 RETURNING album_id',
      values: [fileUrl, id],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed updating album cover. Id not found');
    }
  }

  async checkAlbumLike(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (queryResult.rowCount) {
      throw new InvariantError('Album already liked');
    };
  }

  async likeAlbum(albumId, userId) {
    const query = {
      text: 'INSERT INTO user_album_likes (user_id, album_id) VALUES ($1, $2) RETURNING album_like_id',
      values: [userId, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Failed adding like to album');
    }
  }

  async getAlbumLikes(albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
      values: [albumId],
    };

    const queryResult = await this._pool.query(query);
    const likes = queryResult.rowCount;

    return likes;
  }

  async unlikeAlbum(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING album_like_id',
      values: [userId, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Failed deleting like from album');
    }
  }
}

module.exports = AlbumsService;
