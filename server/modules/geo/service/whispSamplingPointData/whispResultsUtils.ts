import * as StringUtils from '@core/stringUtils'

export const whispExternalIdProp = 'external_id'

// Whisp output properties with no meaning once results are stored in a category
const excludedProps = new Set([whispExternalIdProp, 'plotId', 'geo', 'whisp_processing_metadata'])

// Yearly time series not needed in the category (too many columns)
const excludedPropPrefixes = [
  'GFC_loss_year_',
  'RADD_year_',
  'GLAD-L_year_',
  'GLAD-S2_year_',
  'ESA_fire_',
  'MODIS_fire_',
]

const columnNameMaxLength = 40
const columnNameConflictPrefix = 'whisp_'

export type WhispFeature = {
  properties?: Record<string, unknown> | null
}

export type WhispColumn = {
  prop: string
  column: string
}

type CellValue = string | number

export type WhispValues = Record<string, CellValue>

const isPrimitive = (value: unknown): boolean =>
  value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value)

/**
 * Checks whether a Whisp result property must be left out of the category.
 *
 * @param {string} prop - Name of the property returned by Whisp.
 * @returns {boolean} True if the property must be excluded.
 */
export const isWhispPropExcluded = (prop: string): boolean =>
  excludedProps.has(prop) || excludedPropPrefixes.some((prefix) => prop.startsWith(prefix))

const toColumnName = ({ prop, usedColumnNames }: { prop: string; usedColumnNames: Set<string> }): string => {
  const column = StringUtils.normalizeName(prop) as string
  if (!usedColumnNames.has(column)) return column
  // avoid overriding sampling point data columns (e.g. "area")
  return StringUtils.normalizeName(`${columnNameConflictPrefix}${prop}`).slice(0, columnNameMaxLength) as string
}

/**
 * Converts a Whisp property value into a flat data cell value.
 *
 * @param {unknown} value - The value returned by Whisp.
 * @returns {string|number} The cell value (empty string for missing values).
 */
export const toCellValue = (value: unknown): CellValue => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : ''
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return String(value)
  return ''
}

const isDefined = (value: unknown): boolean => value !== null && value !== undefined && value !== ''

/**
 * Collects what is needed to define the category columns, one Whisp feature at a time,
 * so that the features (hundreds of properties each) don't have to be kept in memory.
 */
export class WhispColumnsCollector {
  private readonly candidateProps = new Set<string>()
  private readonly nonPrimitiveProps = new Set<string>()
  private readonly definedProps = new Set<string>()
  private readonly nonNumericProps = new Set<string>()

  /**
   * Updates the columns info with the specified feature.
   *
   * @param {WhispFeature} feature - Feature returned by Whisp.
   * @returns {WhispValues} The (non-empty) cell values of the feature to store in the category, by Whisp property.
   */
  addFeature(feature: WhispFeature): WhispValues {
    const values: WhispValues = {}
    for (const [prop, value] of Object.entries(feature.properties ?? {})) {
      if (isWhispPropExcluded(prop)) continue

      this.candidateProps.add(prop)
      if (!isPrimitive(value)) {
        this.nonPrimitiveProps.add(prop)
        continue
      }
      if (!isDefined(value)) continue

      this.definedProps.add(prop)
      if (typeof value !== 'number') this.nonNumericProps.add(prop)

      const cellValue = toCellValue(value)
      if (cellValue !== '') values[prop] = cellValue
    }
    return values
  }

  /**
   * Returns the Whisp properties to store in the category, in order of appearance, with their (lower case) column name.
   * Properties having non-primitive values (objects, arrays) are skipped.
   *
   * @param {object} params - The parameters.
   * @param {string[]} params.existingColumnNames - Column names already used (sampling point data columns).
   * @returns {WhispColumn[]} The Whisp columns.
   */
  getColumns({ existingColumnNames }: { existingColumnNames: string[] }): WhispColumn[] {
    const usedColumnNames = new Set(existingColumnNames)
    const columns: WhispColumn[] = []
    for (const prop of this.candidateProps) {
      if (this.nonPrimitiveProps.has(prop)) continue

      const column = toColumnName({ prop, usedColumnNames })
      if (usedColumnNames.has(column)) continue
      usedColumnNames.add(column)
      columns.push({ prop, column })
    }
    return columns
  }

  /**
   * Determines the columns whose values are all numeric (at least one value must be defined).
   *
   * @param {WhispColumn[]} columns - The Whisp columns.
   * @returns {string[]} The names of the numeric columns.
   */
  getNumericColumns(columns: WhispColumn[]): string[] {
    return columns
      .filter(({ prop }) => this.definedProps.has(prop) && !this.nonNumericProps.has(prop))
      .map(({ column }) => column)
  }
}

const collectColumns = (features: WhispFeature[]): WhispColumnsCollector => {
  const collector = new WhispColumnsCollector()
  for (const feature of features) {
    collector.addFeature(feature)
  }
  return collector
}

/**
 * Extracts the Whisp properties to store in the category, in order of appearance, with their (lower case) column name.
 * Properties having non-primitive values (objects, arrays) are skipped.
 *
 * @param {object} params - The parameters.
 * @param {WhispFeature[]} params.features - Features returned by Whisp.
 * @param {string[]} params.existingColumnNames - Column names already used (sampling point data columns).
 * @returns {WhispColumn[]} The Whisp columns.
 */
export const extractWhispColumns = ({
  features,
  existingColumnNames,
}: {
  features: WhispFeature[]
  existingColumnNames: string[]
}): WhispColumn[] => collectColumns(features).getColumns({ existingColumnNames })

/**
 * Determines the Whisp columns whose values are all numeric (at least one value must be defined).
 *
 * @param {object} params - The parameters.
 * @param {WhispColumn[]} params.columns - The Whisp columns.
 * @param {WhispFeature[]} params.features - Features returned by Whisp.
 * @returns {string[]} The names of the numeric columns.
 */
export const findNumericColumns = ({
  columns,
  features,
}: {
  columns: WhispColumn[]
  features: WhispFeature[]
}): string[] => collectColumns(features).getNumericColumns(columns)

/**
 * Splits an array into chunks of the specified size.
 *
 * @param {Array} array - The array to split.
 * @param {number} size - The max size of every chunk.
 * @returns {Array[]} The chunks.
 */
export const toChunks = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size))
  }
  return chunks
}
