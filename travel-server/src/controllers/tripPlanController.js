import tripPlanService from '../services/tripPlanService.js';

export const create = async (req, res, next) => {
  try {
    const plan = await tripPlanService.create(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Trip plan saved', data: plan });
  } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
  try {
    const result = await tripPlanService.list(req.user._id, { page: req.query.page || 1, limit: req.query.limit || 20 });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try {
    const plan = await tripPlanService.getById(req.user._id, req.params.id);
    res.json({ success: true, data: plan });
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await tripPlanService.delete(req.user._id, req.params.id);
    res.json({ success: true, message: 'Trip plan deleted' });
  } catch (e) { next(e); }
};
