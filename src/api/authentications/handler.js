const autoBind = require('auto-bind');

class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    autoBind(this);
  }

  async postAuthenticationHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload);

    const { username, password } = request.payload;

    const userId = await this._usersService.verifyUserCredential(username, password);

    const accessToken = this._tokenManager.generateAccessToken({ userId });
    const refreshToken = this._tokenManager.generateRefreshToken({ userId });

    await this._authenticationsService.addRefreshToken(refreshToken);

    return h.response({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
      },
    }).code(201);
  }

  async putAuthenticationHandler(request) {
    this._validator.validatePutAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;

    await this._authenticationsService.verifyRefreshToken(refreshToken);
    const { userId } = this._tokenManager.verifyRefreshTokenSignature(refreshToken);

    const accessToken = this._tokenManager.generateAccessToken({ userId });

    return {
      status: 'success',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationHandler(request) {
    this._validator.validateDeleteAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;

    await this._authenticationsService.verifyRefreshToken(refreshToken);
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return {
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    };
  }
}

module.exports = AuthenticationsHandler;
