/* eslint-disable camelcase */
const mapSongDBToModel = ({
  song_id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id: song_id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

module.exports = mapSongDBToModel;