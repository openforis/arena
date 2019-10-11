const R = require('ramda')

const keys = {
  code: 'code',
  name: 'name',
  wkt: 'wkt',
}

const newSrs = (code, name, wkt) => ({
  [keys.code]: code,
  [keys.name]: name,
  [keys.wkt]: wkt,
})

//EPSG:4326 WGS84 Lat Lon Spatial Reference System
const latLonSrs = newSrs(
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

const getCode = R.prop(keys.code)
const getName = R.prop(keys.name)
const getWkt = R.prop(keys.wkt)

module.exports = {
  keys,
  latLonSrs,

  newSrs,

  isLatLon: code => getCode(latLonSrs) === code,
  getCode,
  getName,
  getWkt,
}