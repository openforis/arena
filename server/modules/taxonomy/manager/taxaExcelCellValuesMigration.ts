import * as Taxon from '@core/survey/taxon'
import { db } from '@server/db/db'
import { ExcelReader } from '@server/utils/file/excelReader'

import * as TaxonomyRepository from '../repository/taxonomyRepository'

type Props = Record<string, any>

const { extra: extraKey, scientificName: scientificNameKey } = Taxon.propKeys

const toPlainValues = (values: Props): Props =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, ExcelReader.toPlainValue(value)]))

const toPlainProps = (props: Props): Props =>
  props[extraKey] ? { ...toPlainValues(props), [extraKey]: toPlainValues(props[extraKey]) } : toPlainValues(props)

const assocScientificName =
  (scientificName: string) =>
  (props: Props): Props =>
    scientificNameKey in props ? { ...props, [scientificNameKey]: scientificName } : props

/**
 * Replaces the raw Excel cell objects stored in the taxa imported from xlsx files with their plain values.
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {object} [client] - The database client.
 * @returns {Promise<void>}
 */
export const migrateTaxaExcelCellValues = async (
  { surveyId }: { surveyId: number },
  client: any = db
): Promise<void> => {
  const taxa = await TaxonomyRepository.fetchTaxaWithExcelCellObjects({ surveyId }, client)

  for (const { uuid: taxonUuid, taxonomy_uuid: taxonomyUuid, props, props_draft } of taxa) {
    let plainProps = toPlainProps(props)
    let plainPropsDraft = toPlainProps(props_draft)

    const { [scientificNameKey]: scientificName, code } = { ...plainProps, ...plainPropsDraft }
    const scientificNameChanged = typeof { ...props, ...props_draft }[scientificNameKey] === 'object'
    // the object values skipped the duplicates validation: a failure on the unique index would block the survey
    if (
      scientificNameChanged &&
      (await TaxonomyRepository.existsOtherTaxonWithScientificName(
        // NOSONAR
        { surveyId, taxonomyUuid, taxonUuid, scientificName },
        client
      ))
    ) {
      const uniqueScientificName = `${scientificName} (${code})`
      plainProps = assocScientificName(uniqueScientificName)(plainProps)
      plainPropsDraft = assocScientificName(uniqueScientificName)(plainPropsDraft)
    }
    /* NOSONAR */ await TaxonomyRepository.updateTaxonPropsAndPropsDraft(
      { surveyId, taxonUuid, props: plainProps, propsDraft: plainPropsDraft },
      client
    )
  }
}
