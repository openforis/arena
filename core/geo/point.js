import * as R from 'ramda'

const keys = {
  srsId: 'srsId',
  x: 'x',
  y: 'y',
}

export const newPoint = (srsId, x, y) => `SRID=${srsId};POINT(${x} ${y})`

export const parsePoint = (pointText) => {
  const match = /SRID=(\w+);POINT\((\d+(\.\d+)?) (\d+(\.\d+)?)\)/.exec(pointText)
  return match ? newPoint(match[1], match[2], match[4]) : null
}

export const getSrsId = R.prop(keys.srsId)
export const getX = R.prop(keys.x)
export const getY = R.prop(keys.y)
