import { nodeDefType } from './nodeDefType'

export const valuePropsCode = {
  code: 'code',
  itemUuid: 'itemUuid',
  label: 'label',
}

export const valuePropsCoordinate = {
  x: 'x',
  y: 'y',
  srs: 'srs',
}

export const valuePropsDate = {
  day: 'day',
  month: 'month',
  year: 'year',
}

export const valuePropsFile = {
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  fileSize: 'fileSize',
}

export const valuePropsTaxon = {
  code: 'code',
  scientificName: 'scientificName',
  taxonUuid: 'taxonUuid',
  vernacularName: 'vernacularName',
  vernacularNameUuid: 'vernacularNameUuid',
}

export const valuePropsTime = {
  hour: 'hour',
  minute: 'minute',
}

/**
 * Props of node value indexed by node def type.
 * The node definitions here are only the ones of "composite" attributes.
 */
export const valuePropsByType = {
  [nodeDefType.code]: valuePropsCode,
  [nodeDefType.coordinate]: valuePropsCoordinate,
  [nodeDefType.date]: valuePropsDate,
  [nodeDefType.file]: valuePropsFile,
  [nodeDefType.taxon]: valuePropsTaxon,
  [nodeDefType.time]: valuePropsTime,
}
