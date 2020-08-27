import * as R from 'ramda'

const keys = {
  srsId: 'srsId',
  x: 'x',
  y: 'y',
}

export const newPoint = ({ srsId, x, y }) => ({
  [keys.srsId]: srsId,
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
export const parsePoint = (pointText) => {
  const match = /SRID=((EPSG:)?(\w+));POINT\((\d+(\.\d+)?) (\d+(\.\d+)?)\)/.exec(pointText)
  return match ? newPoint({ srsId: match[3], x: match[4], y: match[6] }) : null
}

export const getSrsId = R.prop(keys.srsId)
export const getX = R.prop(keys.x)
export const getY = R.prop(keys.y)

export const toString = (point) => {
  const srsId = getSrsId(point)
  const x = getX(point)
  const y = getY(point)
  return `SRID=${srsId};POINT(${x} ${y})`
}
