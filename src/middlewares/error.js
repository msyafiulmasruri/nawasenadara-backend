import { error } from '../utils/response.js';
import { ClientError } from '../exceptions/index.js';

const errorHandler = (err, req, res, _next) => {
  if (err instanceof ClientError) {
    return error(res, err.message, err.statusCode);
  }

  if (err.isJoi) {
    return error(res, err.details[0].message, 400);
  }

  // Kode error unique constraint PostgreSQL (mis. email/google_id sudah
  // terdaftar).
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    return error(res, `${field} sudah terdaftar.`, 409);
  }

  if (err.code === '23503') {
    return error(res, 'Data referensi tidak ditemukan.', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Token tidak valid.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token kedaluwarsa.', 401);
  }

  console.error('Unhandled error:', err.message);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Terjadi kesalahan pada server.';
  return error(res, message, statusCode);
};

const notFound = (req, res) => {
  return error(res, `Route ${req.originalUrl} tidak ditemukan.`, 404);
};

export { errorHandler, notFound };
