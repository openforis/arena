import * as A from '@core/arena'

const keys = {
  controlPointOffsetNorth: 'controlPointOffsetNorth',
  controlPointOffsetEast: 'controlPointOffsetEast',
  isCircle: 'isCircle',
  lengthLatitude: 'lengthLatitude',
  lengthLongitude: 'lengthLongitude',
  numberOfPointsCircle: 'numberOfPointsCircle',
  numberOfPointsEast: 'numberOfPointsEast',
  numberOfPointsNorth: 'numberOfPointsNorth',
  offsetEast: 'offsetEast',
  offsetNorth: 'offsetNorth',
  radius: 'radius',
}

const samplingPolygonDefaults = {
  [keys.controlPointOffsetNorth]: 0,
  [keys.controlPointOffsetEast]: 0,
  [keys.isCircle]: true,
  [keys.lengthLatitude]: 0,
  [keys.lengthLongitude]: 0,
  [keys.numberOfPointsCircle]: 0,
  [keys.numberOfPointsEast]: 0,
  [keys.numberOfPointsNorth]: 0,
  [keys.offsetNorth]: 0,
  [keys.offsetEast]: 0,
  [keys.radius]: 0,
}

export const getSamplingPolygonDefaults = () => ({ ...samplingPolygonDefaults })

const getProp = (key) => A.propOr(samplingPolygonDefaults[key], key)
const isPropTrue = (key) => (samplingPolygon) => getProp(key)(samplingPolygon) === true

export const getControlPointOffsetEast = getProp(keys.controlPointOffsetEast)
export const getControlPointOffsetNorth = getProp(keys.controlPointOffsetNorth)
export const isCircle = isPropTrue(keys.isCircle)
export const getLengthLatitude = getProp(keys.lengthLatitude)
export const getLengthLongitude = getProp(keys.lengthLongitude)
export const getNumberOfPointsNorth = getProp(keys.numberOfPointsNorth)
export const getNumberOfPointsEast = getProp(keys.numberOfPointsEast)
export const getNumberOfPointsCircle = getProp(keys.numberOfPointsCircle)
export const getOffsetEast = getProp(keys.offsetEast)
export const getOffsetNorth = getProp(keys.offsetNorth)
export const getRadius = getProp(keys.radius)
