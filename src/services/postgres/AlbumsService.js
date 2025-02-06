const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const mapAlbumDBToModel = require('../../utils/mapAlbumDBToModel');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const albumId = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES ($1, $2, $3) RETURNING album_id',
      values: [albumId, name, year],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rows[0].album_id) {
      throw new InvariantError('Failed adding new album');
    }

    await this._cacheService.delete(`albums:${albumId}`);

    return queryResult.rows[0].album_id;
  }

  async getAlbumById(albumId) {
    try {
      const cacheResult = await this._cacheService.get(`albums:${albumId}`);

      return {
        album: JSON.parse(cacheResult),
        source: 'cache'
      };
    } catch {
      const albumQuery = {
        text: 'SELECT * FROM albums WHERE album_id = $1',
        values: [albumId],
      };

      const albumQueryResult = await this._pool.query(albumQuery);

      if (!albumQueryResult.rowCount) {
        throw new NotFoundError('Album with specified id not found');
      }

      const albumData = albumQueryResult.rows.map(mapAlbumDBToModel)[0];

      const songsQuery = {
        text: 'SELECT song_id AS id, title, performer FROM songs WHERE album_id = $1',
        values: [albumId],
      };

      const songsQueryResult = await this._pool.query(songsQuery);

      const album = {
        ...albumData,
        songs: songsQueryResult.rowCount > 0 ? songsQueryResult.rows : [],
      };

      await this._cacheService.set(`albums:${albumId}`, JSON.stringify(album));

      return {
        album,
        source: 'database',
      };
    }
  }

  async editAlbumById(albumId, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE album_id = $3 RETURNING album_id',
      values: [name, year, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed updating album. Id not found');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async deleteAlbumById(albumId) {
    const query = {
      text: 'DELETE FROM albums WHERE album_id = $1 RETURNING album_id',
      values: [albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed deleting album. Id not found');
    }

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async editAlbumCover(albumId, fileUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE album_id = $2 RETURNING album_id',
      values: [fileUrl, albumId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('Failed updating album cover. Id not found');
    }

    await this._cacheService.delete(`albums:${albumId}`);
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

    await this._cacheService.delete(`albums:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      const cacheResult = await this._cacheService.get(`albums:${albumId}`);

      return {
        likes: JSON.parse(cacheResult),
        source: 'cache',
      };
    } catch {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const queryResult = await this._pool.query(query);
      const likes = queryResult.rowCount;

      await this._cacheService.set(`albums:${albumId}`, JSON.stringify(likes));

      return {
        likes,
        source: 'database',
      };
    }
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

    await this._cacheService.delete(`albums:${albumId}`);
  }
}

module.exports = AlbumsService;
