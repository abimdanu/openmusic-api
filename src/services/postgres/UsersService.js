const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const AuthenticationError = require('../../exceptions/AuthenticationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

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
      throw new InvariantError('Gagal menambahkan user');
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
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: 'SELECT user_id, password FROM users WHERE username = $1',
      values: [username],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    const { user_id: userId, password: hashedPassword } = queryResult.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordMatch) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    return userId;
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT username, fullname FROM users WHERE user_id = $1',
      values: [userId],
    };

    const queryResult = await this._pool.query(query);

    if (!queryResult.rowCount) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return queryResult.rows[0];
  }
}

module.exports = UsersService;
