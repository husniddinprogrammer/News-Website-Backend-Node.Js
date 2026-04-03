const authService = require('./auth.service');
const { success, created } = require('../../utils/response.util');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    success(res, result, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body.refreshToken);
    success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
