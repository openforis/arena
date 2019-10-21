/**
 * DO NOT INCLUDE this module in the client side code.
 *
 * This module uses @esri/proj-codes library and stores all the Spatial Reference Systems (with code, name and wkt)
 * into an array that can be huge.
 */
import * as R from 'ramda';

/**
 * Projected coordinate reference systems
 * format: {wkid: id, name:"CRS name", wkt: "Well Know Text"}
 */
import _projected from '@esri/proj-codes/pe_list_projcs.json';
const projected: IProjectedCoordinateSystems = _projected as IProjectedCoordinateSystems;

/**
 * Geographic coordinate reference systems
 * format: same as projected
 */
import _geographic from '@esri/proj-codes/pe_list_geogcs.json';
const geographic: IGeographicCoordinateSystems = _geographic as IGeographicCoordinateSystems;


interface IProjectedCoordinateSystems {
  ProjectedCoordinateSystems: ICoordinateSystem[];
}
interface IGeographicCoordinateSystems {
  GeographicCoordinateSystems: ICoordinateSystem[];
}
interface ICoordinateSystem {
  wkid: number,
  latestWkid: number,
  macro: string;
  name: string;
  wkt: string;
  description: string;
  authority: string;
  version: string;
  deprecated: string;
  areaname: string;
  extent: {
    slat: number;
    nlat: number;
    llon: number;
    rlon: number;
  }
}

import proj4 from 'proj4';
import isValidCoordinates from 'is-valid-coordinates';
import Srs, { ISRS } from './srs';
import ObjectUtils from '../objectUtils';
import NumberUtils from '../numberUtils';
import StringUtils from '../stringUtils';
import { number } from 'prop-types';

const invalidLonLatCoordinates = [0, 90] //proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}
 */
const srsArray = R.pipe(
  R.concat(projected.ProjectedCoordinateSystems),
  R.concat(geographic.GeographicCoordinateSystems),
  R.map(item => Srs.newSrs(item.wkid.toString(), formatName(item.name), item.wkt)),
  R.sortBy(R.prop(Srs.keys.name))
)([])

const srsByCode = ObjectUtils.toIndexedObj(srsArray, Srs.keys.code)

/**
 * Finds a list of srs whose name or code matches the specified parameter
 */
const findSrsByCodeOrName = (codeOrName: string, limit = 200) =>
  R.pipe(
    R.filter((item: ISRS) =>
      StringUtils.contains(codeOrName, item.code) ||
      StringUtils.contains(codeOrName, item.name)
    ) as (items: ISRS[]) => ISRS[],
    R.take(limit)
  )(srsArray)

const getSrsByCode = code => srsByCode[code]

const isCoordinateValid = (srsCode, x, y) => {
  const srs = getSrsByCode(srsCode)

  if (!srs ||
    !NumberUtils.isFloat(x) ||
    !NumberUtils.isFloat(y)) {
    return false
  } else {
    x = NumberUtils.toNumber(x)
    y = NumberUtils.toNumber(y)

    const lonLat = Srs.isLatLon(srsCode)
      ? [x, y] // SRS is lat-lon, projection is not needed
      : proj4(
        Srs.getWkt(srs), //from srs
        Srs.getWkt(Srs.latLonSrs), //to lat lon
        [x, y] //coordinates
      )

    return !R.equals(lonLat, invalidLonLatCoordinates) &&
      isValidCoordinates(lonLat[0], lonLat[1])
  }
}

export default {
  findSrsByCodeOrName,

  isCoordinateValid,
};
