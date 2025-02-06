const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(
    albumsService,
    storageService,
    albumsValidator,
    uploadsValidator,
  ) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._albumsValidator = albumsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._albumsValidator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload;
    const albumId = await this._albumsService.addAlbum({ name, year });

    return h.response({
      status: 'success',
      message: 'Album added successfully',
      data: {
        albumId,
      },
    }).code(201);
  }

  async getAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;
      const albumData = await this._albumsService.getAlbumById(id);
      const { album, source } = albumData;

      return h.response({
        status: 'success',
        data: {
          album,
        },
      }).code(200).header('X-Data-Source', source);
    } catch (error) {
      return error;
    }
  }

  async putAlbumByIdHandler(request) {
    this._albumsValidator.validateAlbumPayload(request.payload);

    const { id } = request.params;
    const { name, year } = request.payload;

    await this._albumsService.editAlbumById(id, { name, year });

    return {
      status: 'success',
      message: 'Album updated successfully',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;

    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album deleted successfully',
    };
  }

  async postAlbumCoverHandler(request, h) {
    const { cover } = request.payload;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    const coverMetadata = cover.hapi;
    const { id: albumId } = request.params;

    const filename = await this._storageService.writeFile(cover, coverMetadata);
    const fileUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/images/${filename}`;

    await this._albumsService.editAlbumCover(albumId, fileUrl);

    return h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    }).code(201);
  }

  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { userId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);
    await this._albumsService.checkAlbumLike(albumId, userId);

    await this._albumsService.likeAlbum(albumId, userId);

    return h.response({
      status: 'success',
      message: 'Album liked successfully',
    }).code(201);
  }

  async deleteAlbumLikeHandler(request) {
    const { id: albumId } = request.params;
    const { userId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);

    await this._albumsService.unlikeAlbum(albumId, userId);

    return {
      status: 'success',
      message: 'Album unliked successfully',
    };
  }

  async getAlbumLikesHandler(request, h) {
    try {
      const { id: albumId } = request.params;

      const likesData = await this._albumsService.getAlbumLikes(albumId);
      const { likes, source } = likesData;

      return h.response({
        status: 'success',
        data: {
          likes,
        },
      }).code(200).header('X-Data-Source', source);
    } catch (error) {
      return error;
    }
  }
}

module.exports = AlbumsHandler;
