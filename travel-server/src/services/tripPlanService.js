import TripPlan from '../models/TripPlan.js';
import { AppError } from '../middleware/errorHandler.js';
//import { isDatabaseConnected } from '../config/database.js';

class TripPlanService {
  _requireDB() {
    if (!isDatabaseConnected()) throw new AppError('Database not available', 503);
  }

  async create(userId, data) {
    this._requireDB();
    return TripPlan.create({ user: userId, ...data });
  }

  async list(userId, { page = 1, limit = 20 }) {
    this._requireDB();
    const skip = (page - 1) * limit;
    const [plans, total] = await Promise.all([
      TripPlan.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      TripPlan.countDocuments({ user: userId }),
    ]);
    return { plans, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(userId, planId) {
    this._requireDB();
    const plan = await TripPlan.findOne({ _id: planId, user: userId });
    if (!plan) throw new AppError('Trip plan not found', 404);
    return plan;
  }

  async delete(userId, planId) {
    this._requireDB();
    const plan = await TripPlan.findOneAndDelete({ _id: planId, user: userId });
    if (!plan) throw new AppError('Trip plan not found', 404);
    return plan;
  }
}

export default new TripPlanService();
