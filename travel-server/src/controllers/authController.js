import authService from '../services/authService.js';

const ok = (res, data, msg = 'ok', code = 200) => res.status(code).json({ success: true, message: msg, data });

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    ok(res, result, 'Registration successful', 201);
  } catch (e) { next(e); }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    ok(res, result, 'Login successful');
  } catch (e) { next(e); }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    ok(res, user);
  } catch (e) {
    next(e);
  }
};
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await authService.updateProfile(
      userId,
      req.body
    );

    ok(res, user, 'Profile updated');
  } catch (e) {
    next(e);
  }
};
