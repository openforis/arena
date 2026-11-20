import * as A from '@core/arena'

export interface SamplingPolygon {
  controlPointOffsetNorth?: number
  controlPointOffsetEast?: number
  isCircle?: boolean
  lengthLatitude?: number
  lengthLongitude?: number
  numberOfPointsCircle?: number
  numberOfPointsEast?: number
  numberOfPointsNorth?: number
  offsetEast?: number
  offsetNorth?: number
  radius?: number
}

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
} as const

const samplingPolygonDefaults: Required<SamplingPolygon> = {
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

export const getSamplingPolygonDefaults = (): Required<SamplingPolygon> => ({ ...samplingPolygonDefaults })

const getProp =
  (key: keyof SamplingPolygon) =>
  (samplingPolygon: SamplingPolygon): number =>
    A.propOr(samplingPolygonDefaults[key], key)(samplingPolygon)
const isPropTrue =
  (key: keyof SamplingPolygon) =>
  (samplingPolygon: SamplingPolygon): boolean =>
    A.propOr(samplingPolygonDefaults[key], key)(samplingPolygon) === true

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
