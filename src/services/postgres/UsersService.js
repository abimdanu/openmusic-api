const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const InvariantError = require('../../exceptions/InvariantError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);

    const userId = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = {
      text: 'INSERT INTO users VALUES ($1, $2, $3, $4) RETURNING user_id',
      values: [userId, username, hashedPassword, fullname],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new InvariantError('Failed adding new user');
    }

    return queryResult.rows[0].user_id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const queryResult = await this._pool.query(query);

    if (queryResult.rowCount > 0) {
      throw new InvariantError('Failed adding new user. Username already exists');
    }
  }
}

module.exports = UsersService;
