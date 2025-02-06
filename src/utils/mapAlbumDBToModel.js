/* eslint-disable camelcase */
const mapAlbumDBToModel = ({
  album_id,
  name,
  year,
  cover_url,
}) => ({
  id: album_id,
  name,
  year,
  coverUrl: cover_url,
});

module.exports = mapAlbumDBToModel;
