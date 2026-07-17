import BkRepositories from '../repositories/bk-repositories.js';
import { success } from '../../../utils/response.js';
import NotFoundError from '../../../exceptions/not-found-error.js';

// GET /api/bk/students
export const listStudents = async (req, res, next) => {
  try {
    const students = await BkRepositories.listStudentsWithSummary();
    return success(res, students);
  } catch (err) {
    next(err);
  }
};

// GET /api/bk/students/:id
export const getStudentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await BkRepositories.getStudentProfile(id);
    if (!profile) return next(new NotFoundError('Siswa tidak ditemukan.'));

    const [episodeProgress, emotionTrend, riskAlerts] = await Promise.all([
      BkRepositories.getStudentEpisodeProgress(id),
      BkRepositories.getStudentEmotionTrend(id),
      BkRepositories.getStudentRiskAlerts(id),
    ]);

    return success(res, {
      profile,
      episode_progress: episodeProgress,
      emotion_trend: emotionTrend,
      risk_alerts: riskAlerts,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/bk/alerts?unacknowledged=true
export const listAlerts = async (req, res, next) => {
  try {
    const onlyUnacknowledged = req.query.unacknowledged === 'true';
    const alerts = await BkRepositories.listAlerts({ onlyUnacknowledged });
    return success(res, alerts);
  } catch (err) {
    next(err);
  }
};

// GET /api/bk/alerts/:id
export const getAlertDetail = async (req, res, next) => {
  try {
    const alert = await BkRepositories.getAlertDetail(req.params.id);
    if (!alert) return next(new NotFoundError('Notifikasi tidak ditemukan.'));
    return success(res, alert);
  } catch (err) {
    next(err);
  }
};

// POST /api/bk/alerts/:id/acknowledge
export const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await BkRepositories.acknowledgeAlert({
      alertId: req.params.id,
      acknowledgedBy: req.user.id,
    });
    if (!alert) {
      return next(
        new NotFoundError('Notifikasi tidak ditemukan atau sudah ditinjau sebelumnya.'),
      );
    }
    return success(res, alert, 'Notifikasi ditandai sudah ditinjau.');
  } catch (err) {
    next(err);
  }
};
