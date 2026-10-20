import { parseCsv } from '@test/utils/csvUtils'

import { formatDate, srsLabels, TaxonValue } from '../../helpers/recordForm'
import { taxonomyCsvPath } from './sampleSurvey'
import { flattenCategoryItems, SampleRecord } from './sampleSurveyModel'

type TaxonRow = { code: string; family: string; genus: string; scientific_name: string }

export const taxa: TaxonRow[] = parseCsv(taxonomyCsvPath)

export const getTaxon = (code: string): TaxonValue => {
  const row = taxa.find((taxon) => taxon.code === code)!
  return { code, scientificName: row.scientific_name, vernacularName: '' }
}

export const getCategoryItemLabel = (code: string): string => {
  const item = flattenCategoryItems().find((_item) => _item.code === code)!
  return `${item.label} (${code})`
}

/**
 * Returns the values of the specified record as displayed in the record editor.
 * @param {SampleRecord} record - The sample record.
 * @returns {object} - The displayed values, by node def name.
 */
export const toDisplayValues = (record: SampleRecord) => ({
  cluster_id: record.cluster_id,
  cluster_decimal: record.cluster_decimal,
  cluster_date: formatDate(record.cluster_date),
  cluster_time: record.cluster_time,
  cluster_boolean: record.cluster_boolean,
  cluster_coordinate: { ...record.cluster_coordinate, srsLabel: srsLabels[record.cluster_coordinate.srs] },
  cluster_country: getCategoryItemLabel(record.cluster_country),
  cluster_region: getCategoryItemLabel(record.cluster_region),
  cluster_province: getCategoryItemLabel(record.cluster_province),
  plot_id: record.plot_id,
  plot_text: record.plot_text,
  trees: record.trees.map((tree) => ({
    tree_id: tree.tree_id,
    tree_dec_1: tree.tree_dec_1,
    tree_dec_2: tree.tree_dec_2,
    tree_species: getTaxon(tree.tree_species),
  })),
})
