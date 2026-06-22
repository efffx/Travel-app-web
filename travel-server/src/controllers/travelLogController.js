import travelLogService from '../services/travelLogService.js';

const ok = (res, data, msg = 'ok', code = 200) => res.status(code).json({ success: true, message: msg, data });
const paginated = (res, data) => res.status(200).json({ success: true, data, ...data });

export const create = async (req, res, next) => {
  try {
    const log = await travelLogService.create(req.user._id, req.body);
    ok(res, log, 'Travel log created', 201);
  } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
  try {
    const result = await travelLogService.list(req.user._id, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20 });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try {
    const log = await travelLogService.getById(req.user._id, req.params.id);
    ok(res, log);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const log = await travelLogService.update(req.user._id, req.params.id, req.body);
    ok(res, log, 'Travel log updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await travelLogService.delete(req.user._id, req.params.id);
    ok(res, null, 'Travel log deleted');
  } catch (e) { next(e); }
};

export const stats = async (req, res, next) => {
  try {
    const s = await travelLogService.stats(req.user._id);
    ok(res, s);
  } catch (e) { next(e); }
};
