/**
 * Isomorphic node value parser, shared by the flat-data import (layer 1: value props read from a file row)
 * and by the assistant (layer 2, parseNodeValueInput below: a single string or object written by the model).
 */
import { Objects } from '@openforis/arena-core'

import SystemError from '@core/systemError'
import * as Srs from '@core/geo/srs'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

export type CategoryItemProvider = {
  getItemByCodePaths: (params: { survey: any; categoryUuid: string; codePaths: string[] }) => Promise<any | null>
}

export type TaxonProvider = {
  getTaxonByCode: (params: { survey: any; taxonomyUuid: string; taxonCode: string }) => Promise<any | null>
  // optional: only the browser provider can search taxa by scientific name
  findTaxonByScientificName?: (params: {
    survey: any
    taxonomyUuid: string
    scientificName: string
  }) => Promise<any | null>
}

export type ParsedNodeValue = { value: any; refData: Record<string, unknown> | null }

type ExtractorParams = {
  survey: any
  nodeDef: any
  value: Record<string, any>
  headers: string[]
  categoryItemProvider: CategoryItemProvider
  taxonProvider: TaxonProvider
}

type Extractor = (params: ExtractorParams) => ParsedNodeValue | Promise<ParsedNodeValue>

export const VALUE_PROP_DEFAULT = 'value'

const allowedBooleanValues = new Set(['true', 'false', 'yes', 'no', '1', '0'])
const booleanTrueValues = new Set(['true', 'yes', '1'])

/**
 * Generates the accepted date formats for a separator.
 * @param {string} sep - The separator between day, month and year.
 * @returns {string[]} The date formats.
 */
const generateAllowedDateFormats = (sep: string): string[] => [
  `DD${sep}MM${sep}YYYY`,
  `D${sep}MM${sep}YYYY`,
  `D${sep}M${sep}YYYY`,
  `DD${sep}M${sep}YYYY`,
  `YYYY${sep}MM${sep}DD`,
  `YYYY${sep}MM${sep}D`,
  `YYYY${sep}M${sep}D`,
  `YYYY${sep}M${sep}DD`,
]

const dateFormatsSeparators = ['/', '-', '.']

const allowedDateFormats = dateFormatsSeparators.flatMap(generateAllowedDateFormats)
const allowedTimeFormats = [DateUtils.formats.timeStorage, 'H:mm', DateUtils.formats.timeWithSeconds, 'H:mm:ss']

/**
 * Returns the default value prop of a value object.
 * @param {object} params - The parameters.
 * @param {object} params.value - The value props.
 * @returns {any} The default value prop.
 */
const singlePropValueConverter = ({ value }: { value: Record<string, any> }): any => value[VALUE_PROP_DEFAULT]

/**
 * Converts the default value prop into a number.
 * @param {object} params - The parameters.
 * @param {object} params.value - The value props.
 * @param {string[]} params.headers - The headers, for the error message.
 * @returns {number} The number.
 */
const numericValueConverter = ({ value, headers }: { value: Record<string, any>; headers: string[] }): number => {
  const val = singlePropValueConverter({ value })
  const numericVal = Number(val)
  if (Number.isNaN(numericVal)) {
    throw new SystemError('validationErrors:dataImport.invalidNumber', { value: val, headers })
  }
  return numericVal
}

/**
 * Parses a date or time with the accepted formats and formats it for storage.
 * @param {object} params - The parameters.
 * @param {object} params.value - The value props.
 * @param {string[]} params.allowedFormats - The accepted formats.
 * @param {string} params.formatTo - The storage format.
 * @param {string[]} params.headers - The headers, for the error message.
 * @param {string} params.errorKey - The error key when no format matches.
 * @returns {string} The formatted value.
 */
const extractDateOrTime = ({
  value,
  allowedFormats,
  formatTo,
  headers,
  errorKey,
}: {
  value: Record<string, any>
  allowedFormats: string[]
  formatTo: string
  headers: string[]
  errorKey: string
}): string => {
  const val = singlePropValueConverter({ value })
  let dateObj = null
  const valueIsInValidFormat = allowedFormats.some((format) => {
    // date and time values are without timezone; strict parsing checks the exact format
    dateObj = DateUtils.parse(val, format as any, { keepTimeZone: false, strict: true })
    return DateUtils.isValidDateObject(dateObj)
  })
  if (!valueIsInValidFormat) {
    throw new SystemError(errorKey, { headers, value: val })
  }
  return DateUtils.format(dateObj, formatTo)
}

/**
 * Finds the uuid of a vernacular name of a taxon, written as "Name" or "Name (lang)".
 * @param {object} params - The parameters.
 * @param {object} params.taxon - The taxon.
 * @param {string} params.vernacularName - The vernacular name.
 * @returns {string|null} The vernacular name uuid, or null.
 */
const extractVernacularNameUuid = ({ taxon, vernacularName }: { taxon: any; vernacularName: string }) => {
  if (Objects.isEmpty(vernacularName)) return null

  const regExp = /^([^(]+)(\s\(([^)]+)\))?$/
  const vernacularNameParts = regExp.exec(vernacularName)
  const vernacularNameText = vernacularNameParts[1]
  const vernacularNameLang = vernacularNameParts[3]
  const vernacularNames = vernacularNameLang
    ? Taxon.getVernacularNamesByLang(vernacularNameLang)(taxon)
    : Taxon.getVernacularNamesArray(taxon)
  const vernacularNameObj = vernacularNames.find((vn: any) => TaxonVernacularName.getName(vn) === vernacularNameText)
  return TaxonVernacularName.getUuid(vernacularNameObj)
}

/**
 * Finds a first-level category item by code: the survey index, else the provider (big categories).
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {CategoryItemProvider} params.categoryItemProvider - The item provider.
 * @param {object} params.nodeDef - The code attribute definition.
 * @param {string} params.code - The code.
 * @returns {Promise<object|null>} The item, or null.
 */
const findCategoryItem = async ({
  survey,
  categoryItemProvider,
  nodeDef,
  code,
}: {
  survey: any
  categoryItemProvider: CategoryItemProvider
  nodeDef: any
  code: string
}) => {
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const codePaths = [code] // only first level items are supported at this stage
  const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy({ nodeDef, code })(survey)
  if (itemUuid) {
    return Survey.getCategoryItemByUuid(itemUuid)(survey) ?? { uuid: itemUuid }
  }
  return categoryItemProvider.getItemByCodePaths({ survey, categoryUuid, codePaths })
}

/**
 * Finds a taxon by code: the survey index, else the provider (big taxonomies).
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {TaxonProvider} params.taxonProvider - The taxon provider.
 * @param {object} params.nodeDef - The taxon attribute definition.
 * @param {string} params.taxonCode - The taxon code.
 * @returns {Promise<object|null>} The taxon, or null.
 */
export const findTaxonByCode = async ({
  survey,
  taxonProvider,
  nodeDef,
  taxonCode,
}: {
  survey: any
  taxonProvider: TaxonProvider
  nodeDef: any
  taxonCode: string
}) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  return (
    Survey.getTaxonByCode({ taxonomyUuid, taxonCode })(survey) ??
    (await taxonProvider.getTaxonByCode({ survey, taxonomyUuid, taxonCode }))
  )
}

const timeWithSecondsValuePattern = /^\d{1,2}:\d{2}:\d{2}$/

/**
 * Extracts and validates a time value, formatting it according to the node definition's seconds setting.
 * @param {object} params - The parameters.
 * @param {object} params.value - The value props.
 * @param {string[]} params.headers - The headers, for the error message.
 * @param {object} params.nodeDef - The time attribute definition.
 * @returns {ParsedNodeValue} The formatted time and a null refData.
 */
export const extractTimeValue = ({
  value,
  headers,
  nodeDef,
}: {
  value: Record<string, any>
  headers: string[]
  nodeDef: any
}): ParsedNodeValue => {
  const val = value[VALUE_PROP_DEFAULT]
  // HH:mm input into a seconds-enabled attribute is kept as is, instead of being padded with ":00"
  const valueHasSeconds = typeof val === 'string' && timeWithSecondsValuePattern.test(val.trim())
  const formatTo = valueHasSeconds
    ? DateUtils.getTimeFormat(NodeDef.isSecondsIncluded(nodeDef))
    : DateUtils.formats.timeStorage
  return {
    value: extractDateOrTime({
      value,
      allowedFormats: allowedTimeFormats,
      formatTo,
      headers,
      errorKey: 'validationErrors:dataImport.invalidTime',
    }),
    refData: null,
  }
}

/**
 * Extracts a boolean value.
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {ParsedNodeValue} 'true' or 'false'.
 */
const extractBoolean: Extractor = ({ value, headers }) => {
  const val = singlePropValueConverter({ value })
  if (!allowedBooleanValues.has(String(val).toLocaleLowerCase())) {
    throw new SystemError('validationErrors:dataImport.invalidBoolean', { value: val, headers })
  }
  return { value: String(booleanTrueValues.has(String(val).toLocaleLowerCase())), refData: null }
}

/**
 * Extracts a code value; hierarchical codes keep the code only (the item depends on the parent item).
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {Promise<ParsedNodeValue>} The code value and the category item as ref data.
 */
const extractCode: Extractor = async ({ survey, categoryItemProvider, nodeDef, value }) => {
  const code = value[Node.valuePropsCode.code]

  const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
  if (Category.isFlat(category) || !NodeDef.getParentCodeDefUuid(nodeDef)) {
    const item = await findCategoryItem({ survey, categoryItemProvider, nodeDef, code })
    if (!item) {
      const attributeName = NodeDef.getName(nodeDef)
      throw new SystemError('validationErrors:dataImport.invalidCode', { code, attributeName })
    }
    return {
      value: Node.newNodeValueCode({ itemUuid: item.uuid, code }),
      refData: { [NodeRefData.keys.categoryItem]: item },
    }
  }
  return { value: Node.newNodeValueCode({ code }), refData: null }
}

/**
 * Extracts a coordinate value (srs without the "EPSG:" prefix, plus the additional fields).
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {ParsedNodeValue} The coordinate value.
 */
const extractCoordinate: Extractor = ({ nodeDef, value }) => {
  const srsId = StringUtils.removePrefix(Srs.idPrefix)(value[Node.valuePropsCoordinate.srs])
  const x = value[Node.valuePropsCoordinate.x]
  const y = value[Node.valuePropsCoordinate.y]
  const additionalValuesByField: Record<string, unknown> = {}
  for (const field of NodeDef.getCoordinateAdditionalFields(nodeDef)) {
    if (value[field] !== undefined) {
      additionalValuesByField[field] = value[field]
    }
  }
  return { value: Node.newNodeValueCoordinate({ x, y, srsId, ...additionalValuesByField }), refData: null }
}

/**
 * Extracts a date value.
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {ParsedNodeValue} The ISO date.
 */
const extractDate: Extractor = ({ value, headers }) => ({
  value: extractDateOrTime({
    value,
    allowedFormats: allowedDateFormats,
    formatTo: DateUtils.formats.dateISO,
    headers,
    errorKey: 'validationErrors:dataImport.invalidDate',
  }),
  refData: null,
})

/**
 * Extracts a file value (a new file uuid when none is given).
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {ParsedNodeValue} The file value.
 */
const extractFile: Extractor = ({ value, headers }) => {
  const { fileName, fileUuid: fileUuidInValue } = value
  if (Objects.isEmpty(fileName)) {
    throw new SystemError('validationErrors:dataImport.emptyFileName', { headers, fileName })
  }
  const fileUuid = fileUuidInValue ?? uuidv4()
  return {
    value: { [Node.valuePropsFile.fileUuid]: fileUuid, [Node.valuePropsFile.fileName]: fileName },
    refData: null,
  }
}

/**
 * Extracts a numeric value.
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {ParsedNodeValue} The number.
 */
const extractNumber: Extractor = (params) => ({ value: numericValueConverter(params), refData: null })

/**
 * Extracts a taxon value by code (unlisted taxa keep the scientific and vernacular names).
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {Promise<ParsedNodeValue>} The taxon value and the taxon as ref data.
 */
const extractTaxon: Extractor = async ({ survey, taxonProvider, nodeDef, value, headers }) => {
  const taxonCode = value[Node.valuePropsTaxon.code]
  const taxon = await findTaxonByCode({ survey, taxonProvider, nodeDef, taxonCode })
  if (!taxon) {
    throw new SystemError('validationErrors:dataImport.invalidTaxonCode', { value: taxonCode, headers })
  }
  const taxonUuid = Taxon.getUuid(taxon)
  const vernacularName = value[Node.valuePropsTaxon.vernacularName]
  const scientificName = value[Node.valuePropsTaxon.scientificName]

  if (taxonCode === Taxon.unlistedCode) {
    return {
      value: {
        [Node.valuePropsTaxon.taxonUuid]: taxonUuid,
        [Node.valuePropsTaxon.scientificName]: scientificName,
        [Node.valuePropsTaxon.vernacularName]: vernacularName,
      },
      refData: { [NodeRefData.keys.taxon]: taxon },
    }
  }
  const vernacularNameUuid = extractVernacularNameUuid({ taxon, vernacularName })
  const nodeValue = Node.newNodeValueTaxon({ taxonUuid })
  if (vernacularNameUuid) {
    nodeValue[Node.valuePropsTaxon.vernacularNameUuid] = vernacularNameUuid
  }
  return { value: nodeValue, refData: { [NodeRefData.keys.taxon]: taxon } }
}

/**
 * Extracts a text value.
 * @param {ExtractorParams} params - The extractor parameters.
 * @returns {ParsedNodeValue} The string, or null.
 */
const extractText: Extractor = ({ value }) => {
  const val = singlePropValueConverter({ value })
  return { value: val === null || val === undefined ? null : String(val), refData: null }
}

const extractorByNodeDefType: Record<string, Extractor> = {
  [NodeDef.nodeDefType.boolean]: extractBoolean,
  [NodeDef.nodeDefType.code]: extractCode,
  [NodeDef.nodeDefType.coordinate]: extractCoordinate,
  [NodeDef.nodeDefType.date]: extractDate,
  [NodeDef.nodeDefType.decimal]: extractNumber,
  [NodeDef.nodeDefType.file]: extractFile,
  [NodeDef.nodeDefType.integer]: extractNumber,
  [NodeDef.nodeDefType.taxon]: extractTaxon,
  [NodeDef.nodeDefType.text]: extractText,
  [NodeDef.nodeDefType.time]: extractTimeValue,
}

/**
 * Converts the value props of an attribute (as read from a file row) into a node value and its ref data.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey (with the ref data index).
 * @param {object} params.nodeDef - The attribute definition.
 * @param {object} params.valueProps - The value props (e.g. { value }, { code }, { x, y, srs }).
 * @param {string[]} [params.headers] - The headers the value comes from, for the error messages.
 * @param {CategoryItemProvider} params.categoryItemProvider - Finds items of big categories.
 * @param {TaxonProvider} params.taxonProvider - Finds taxa of big taxonomies.
 * @returns {Promise<ParsedNodeValue>} The node value and its ref data.
 */
export const parseNodeValueProps = async ({
  survey,
  nodeDef,
  valueProps,
  headers = [],
  categoryItemProvider,
  taxonProvider,
}: {
  survey: any
  nodeDef: any
  valueProps: Record<string, any>
  headers?: string[]
  categoryItemProvider: CategoryItemProvider
  taxonProvider: TaxonProvider
}): Promise<ParsedNodeValue> => {
  const type = NodeDef.getType(nodeDef)
  const extractor = extractorByNodeDefType[type]
  if (!extractor) {
    throw new SystemError('validationErrors:nodeValueParser.unsupportedType', {
      attributeName: NodeDef.getName(nodeDef),
      type,
    })
  }
  return extractor({ survey, categoryItemProvider, taxonProvider, nodeDef, value: valueProps, headers })
}
