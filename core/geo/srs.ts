import * as R from 'ramda';

export const keys = {
  code: 'code',
  name: 'name',
  wkt: 'wkt',
}

export interface ISRS {
  code: string;
  name: string;
  wkt: string;
}
export const newSrs: (code: string, name: string, wkt: string) => ISRS
= (code, name, wkt) => ({code, name, wkt})

//EPSG:4326 WGS84 Lat Lon Spatial Reference System
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

export const getCode: (obj: ISRS) => string = R.prop(keys.code) as (obj: ISRS) => string
export const getName: (obj: ISRS) => string = R.prop(keys.name) as (obj: ISRS) => string
export const getWkt: (obj: ISRS) => string = R.prop(keys.wkt) as (srs: ISRS) => string

export default {
  keys,
  latLonSrs,

  newSrs,

  isLatLon: (code: string) => getCode(latLonSrs) === code,
  getCode,
  getName,
  getWkt,
};
