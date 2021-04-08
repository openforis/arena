import * as A from '@core/arena'

const keys = {
  srs: 'srs',
  x: 'x',
  y: 'y',
}

export const newPoint = ({ srs, x, y }) => ({
  [keys.srs]: srs,
  [keys.x]: x,
  [keys.y]: y,
})

/**
 * Parses a point in the format: SRID=SRS_CODE;POINT(X Y)
 * Valid examples are:
 * - SRID=EPSG:4326;POINT(12.489060, 41.882788)
 * - SRID=4326;POINT(12, 41).
 *
 * @param {!string} pointText - The point to parse.
 * @returns {object} - The parsed Point object.
 */
export const parse = (pointText) => {
  const match = /SRID=((EPSG:)?(\w+));POINT\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/.exec(pointText)
  return match ? newPoint({ srs: match[3], x: match[4], y: match[6] }) : null
}

export const getSrs = A.propOr(null, keys.srs)
export const getX = A.propOr(null, keys.x)
export const getY = A.propOr(null, keys.y)

export const toString = (point) => {
  const srsId = getSrs(point)
  const x = getX(point)
  const y = getY(point)
  return `SRID=${srsId};POINT(${x} ${y})`
}

export const isFilled = (point) =>
  point && !A.isEmpty(getX(point)) && !A.isEmpty(getY(point)) && !A.isEmpty(getSrs(point))
