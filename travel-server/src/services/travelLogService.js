import TravelLog from '../models/TravelLog.js';
import { AppError } from '../middleware/errorHandler.js';


class TravelLogService {
  _requireDB() {
    if (!isDatabaseConnected()) throw new AppError('Database not available. Start MongoDB with: docker compose up -d', 503);
  }

  async create(userId, data) {
    this._requireDB();
    return TravelLog.create({ user: userId, ...data });
  }

  async list(userId, { page = 1, limit = 20 }) {
    this._requireDB();
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      TravelLog.find({ user: userId }).sort({ startDate: -1 }).skip(skip).limit(limit),
      TravelLog.countDocuments({ user: userId }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(userId, logId) {
    this._requireDB();
    const log = await TravelLog.findOne({ _id: logId, user: userId });
    if (!log) throw new AppError('Travel log not found', 404);
    return log;
  }

  async update(userId, logId, data) {
    this._requireDB();
    const log = await TravelLog.findOneAndUpdate({ _id: logId, user: userId }, data, { new: true, runValidators: true });
    if (!log) throw new AppError('Travel log not found', 404);
    return log;
  }

  async delete(userId, logId) {
    this._requireDB();
    const log = await TravelLog.findOneAndDelete({ _id: logId, user: userId });
    if (!log) throw new AppError('Travel log not found', 404);
    return log;
  }

  async stats(userId) {
    this._requireDB();
    const [totalTrips, totalCities, totalSpent] = await Promise.all([
      TravelLog.countDocuments({ user: userId }),
      TravelLog.distinct('destination', { user: userId }),
      TravelLog.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: '$totalSpent' } } }]),
    ]);
    return {
      trips: totalTrips,
      cities: totalCities.length,
      totalSpent: totalSpent[0]?.total || 0,
    };
  }
}

export default new TravelLogService();
