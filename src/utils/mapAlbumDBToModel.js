/* eslint-disable camelcase */
const mapAlbumDBToModel = ({
  album_id,
  name,
  year,
}) => ({
  id: album_id,
  name,
  year,
});

module.exports = mapAlbumDBToModel;