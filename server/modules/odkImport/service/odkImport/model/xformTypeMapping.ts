import { nodeDefType } from '@core/survey/nodeDef'

export type NodeDefTypeValue = (typeof nodeDefType)[keyof typeof nodeDefType]

export type OdkTypeMappingFlag = 'unmappedType' | 'lossyGeoConversion' | 'skippedNote'

export interface OdkTypeMappingResult {
  nodeDefType: NodeDefTypeValue | null
  skip: boolean
  flag: OdkTypeMappingFlag | null
}

const mapped = (type: NodeDefTypeValue): OdkTypeMappingResult => ({ nodeDefType: type, skip: false, flag: null })

const lossy = (type: NodeDefTypeValue, flag: OdkTypeMappingFlag): OdkTypeMappingResult => ({
  nodeDefType: type,
  skip: false,
  flag,
})

const skipped = (flag: OdkTypeMappingFlag): OdkTypeMappingResult => ({ nodeDefType: null, skip: true, flag })

const isTruthyXPathBoolean = (value: string | null): boolean => value === 'true()' || value === 'true'

/**
 * Maps an ODK/XForm bind `type` to the closest Arena NodeDef type, per the mapping table in
 * docs/superpowers/specs/2026-09-09-odk-import-design.md. Every unmapped or lossy case is flagged
 * (never a silent drop); `skip: true` means no NodeDef should be created at all (ODK's readonly,
 * body-less "note" idiom, which Arena has no display-only equivalent for).
 * @param params - Function parameters.
 * @param params.odkType - The bind's `type` attribute (e.g. 'string', 'int', 'select1'), or null.
 * @param params.readonly - The bind's `readonly` attribute, or null.
 * @param params.hasBodyControl - Whether a body element (input/select.../upload/...) references this path.
 * @returns The mapping result.
 */
export const mapXFormTypeToNodeDefType = ({
  odkType,
  readonly,
  hasBodyControl,
}: {
  odkType: string | null
  readonly: string | null
  hasBodyControl: boolean
}): OdkTypeMappingResult => {
  switch (odkType) {
    case 'string':
      if (isTruthyXPathBoolean(readonly) && !hasBodyControl) return skipped('skippedNote')
      return mapped(nodeDefType.text)
    case 'int':
      return mapped(nodeDefType.integer)
    case 'decimal':
      return mapped(nodeDefType.decimal)
    case 'date':
      return mapped(nodeDefType.date)
    case 'time':
      return mapped(nodeDefType.time)
    case 'dateTime':
      return lossy(nodeDefType.text, 'unmappedType')
    case 'geopoint':
      return mapped(nodeDefType.coordinate)
    case 'geotrace':
    case 'geoshape':
      return lossy(nodeDefType.geo, 'lossyGeoConversion')
    case 'binary':
      return mapped(nodeDefType.file)
    case 'barcode':
      return lossy(nodeDefType.text, 'unmappedType')
    case 'select1':
    case 'select':
      return mapped(nodeDefType.code)
    default:
      return lossy(nodeDefType.text, 'unmappedType')
  }
}

export type ArenaFileType = 'image' | 'video' | 'audio' | 'other'

/**
 * Disambiguates an ODK `binary` bind into Arena's file-type prop, from the body <upload mediatype="...">
 * attribute (the bind alone never distinguishes image/audio/video).
 * @param mediatype - The body control's `mediatype` attribute (e.g. 'image/*'), or null.
 * @returns The matching Arena file type, defaulting to 'other' when absent/unrecognized.
 */
export const arenaFileTypeFromMediatype = (mediatype: string | null): ArenaFileType => {
  if (mediatype?.startsWith('image/')) return 'image'
  if (mediatype?.startsWith('video/')) return 'video'
  if (mediatype?.startsWith('audio/')) return 'audio'
  return 'other'
}
