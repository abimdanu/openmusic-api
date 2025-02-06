/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('user_album_likes', {
    /* eslint-disable camelcase */
    album_like_id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users(user_id)',
      onDelete: 'cascade',
    },
    album_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'albums(album_id)',
      onDelete: 'cascade',
    }
  });

  pgm.addConstraint(
    'user_album_likes',
    'unique_album_id_and_user_id_combinations',
    'UNIQUE(user_id, album_id)',
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropConstraint('user_album_likes', 'unique_album_id_and_user_id_combinations');
  pgm.dropTable('user_album_likes');
};
