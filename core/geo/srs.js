import * as R from 'ramda'

export const keys = {
  code: 'code',
  name: 'name',
  wkt: 'wkt',
}

// ===== CREATE
export const newSrs = (code, name, wkt) => ({
  [keys.code]: code,
  [keys.name]: name,
  [keys.wkt]: wkt,
})

// ===== READ
export const getCode = R.prop(keys.code)
export const getName = R.prop(keys.name)
export const getWkt = R.prop(keys.wkt)

// ===== UTILS

// EPSG:4326 WGS84 Lat Lon Spatial Reference System
export const latLonSrs = newSrs(
  '4326',
  'GCS WGS 1984',
  `GEOGCS["WGS 84",
      DATUM["WGS_1984",
          SPHEROID["WGS 84",6378137,298.257223563,
              AUTHORITY["EPSG","7030"]],
          AUTHORITY["EPSG","6326"]],
      PRIMEM["Greenwich",0,
          AUTHORITY["EPSG","8901"]],
      UNIT["degree",0.01745329251994328,
          AUTHORITY["EPSG","9122"]],
      AUTHORITY["EPSG","4326"]]`
)

export const latLongSrsCode = getCode(latLonSrs)
export const isLatLong = (code) => latLongSrsCode === code
