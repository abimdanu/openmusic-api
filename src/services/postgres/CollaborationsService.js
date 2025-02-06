const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addCollaboration(playlistId, userId) {
    const collaborationId = `collab-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING collaboration_id',
      values: [collaborationId, playlistId, userId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Gagal menambahkan kolaborasi');
    }

    return queryResult.rows[0].collaboration_id;
  }

  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING collaboration_id',
      values: [playlistId, userId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Gagal menghapus kolaborasi');
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }

    return queryResult.rows[0].collaboration_id;
  }
}

module.exports = CollaborationsService;
