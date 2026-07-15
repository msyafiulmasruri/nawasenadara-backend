import UserRepositories from '../repositories/user-repositories.js';
import { success } from '../../../utils/response.js';
import NotFoundError from '../../../exceptions/not-found-error.js';

// GET /api/auth/me
export const getMe = async (req, res) => {
  return success(res, { user: req.user }, 'Profil pengguna');
};

// PUT /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { name } = req.validated;
    const user = await UserRepositories.updateName({ id: req.user.id, name });

    if (!user) {
      return next(new NotFoundError('User tidak ditemukan.'));
    }

    return success(res, { user }, 'Profil berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
};
