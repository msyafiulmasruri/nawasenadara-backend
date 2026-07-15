/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    email: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'VARCHAR(255)',
    },
    google_id: {
      type: 'VARCHAR(255)',
      unique: true,
    },
    avatar_url: {
      type: 'TEXT',
    },
    provider: {
      type: 'VARCHAR(50)',
      notNull: true,
      default: "'local'",
    },
    // Peran pengguna di ekosistem Nawasena Dara — dipakai untuk
    // membedakan tampilan/hak akses siswa (pemain), guru BK
    // (dashboard monitoring), dan orang tua (ringkasan progres anak).
    role: {
      type: 'VARCHAR(20)',
      notNull: true,
      default: "'siswa'",
    },
    is_verified: {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('users', 'email', { name: 'idx_users_email' });

  pgm.addConstraint('users', 'chk_users_role', {
    check: "role IN ('siswa', 'guru_bk', 'orang_tua')",
  });

  pgm.addConstraint('users', 'chk_users_provider', {
    check: "provider IN ('local', 'google')",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropIndex('users', 'email', { name: 'idx_users_email', ifExists: true });
  pgm.dropTable('users');
};
