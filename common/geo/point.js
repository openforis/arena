const newPoint = (srsId, x, y) => `SRID=${srsId};POINT(${x} ${y})`

module.exports = {
  newPoint,
}