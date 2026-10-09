import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'

import type { CleaningApi } from './cleaningApi'

/**
 * Returns the first item whose value of `getText` equals `text` (case-insensitive when asked).
 * @param {object[]} items - Candidates.
 * @param {Function} getText - Reads the compared text.
 * @param {string} text - Searched text.
 * @param {boolean} [ignoreCase] - Whether the comparison ignores case.
 * @returns {object|null} The item.
 */
const findExact = (items: any[], getText: (item: any) => string, text: string, ignoreCase = false): any | null => {
  const normalize = (value: string) => (ignoreCase ? value.trim().toLowerCase() : value.trim())
  return items.find((item) => normalize(getText(item) ?? '') === normalize(text)) ?? null
}

/**
 * Creates the category item and taxon providers used by the parser and the preview in the browser.
 * Items and taxa found through the API are kept, so the validation of the preview finds them by uuid.
 * @param {object} params - Parameters.
 * @param {CleaningApi} params.api - Cleaning API.
 * @param {number} params.surveyId - Survey id.
 * @param {AbortSignal} [params.signal] - Aborts the lookups.
 * @returns {{categoryItemProvider: object, taxonProvider: object}} The providers.
 */
export const createRefDataProviders = ({
  api,
  surveyId,
  signal,
}: {
  api: CleaningApi
  surveyId: number
  signal?: AbortSignal
}) => {
  const itemsByUuid = new Map<string, any>()
  const taxaByUuid = new Map<string, any>()

  const keepTaxon = (taxon: any) => {
    if (taxon) taxaByUuid.set(taxon.uuid, taxon)
    return taxon
  }

  const categoryItemProvider = {
    /**
     * Finds an item by its codes, one level at a time (the items API searches by code under a parent).
     * @param {object} params - Parameters.
     * @param {string} params.categoryUuid - Category uuid.
     * @param {string[]} params.codePaths - Codes, top-down.
     * @returns {Promise<object|null>} The item.
     */
    getItemByCodePaths: async ({ categoryUuid, codePaths }: { categoryUuid: string; codePaths: string[] }) => {
      let item: any = null
      for (const code of codePaths) {
        const items = await api.fetchCategoryItems({
          surveyId,
          categoryUuid,
          parentUuid: item?.uuid ?? null,
          search: code,
          signal,
        })
        item = findExact(items, CategoryItem.getCode, code)
        if (!item) return null
        itemsByUuid.set(item.uuid, item)
      }
      return item
    },
    /**
     * Finds an item by uuid: the survey index, then the items found before.
     * @param {object} params - Parameters.
     * @param {object} params.survey - The survey.
     * @param {string} params.itemUuid - Item uuid.
     * @returns {Promise<object|null>} The item.
     */
    getItemByUuid: async ({ survey, itemUuid }: { survey: any; itemUuid: string }) =>
      Survey.getCategoryItemByUuid(itemUuid)(survey) ?? itemsByUuid.get(itemUuid) ?? null,
    /**
     * Lists the items under a parent (entity enumeration only; not used by attribute edits).
     * @param {object} params - Parameters.
     * @param {string} params.categoryUuid - Category uuid.
     * @param {string} [params.parentItemUuid] - Parent item uuid.
     * @returns {Promise<object[]>} The items.
     */
    getItems: async ({ categoryUuid, parentItemUuid }: { categoryUuid: string; parentItemUuid?: string | null }) =>
      api.fetchCategoryItems({ surveyId, categoryUuid, parentUuid: parentItemUuid ?? null, search: '', signal }),
  }

  const taxonProvider = {
    /**
     * Finds a taxon by its code (exact, case-insensitive).
     * @param {object} params - Parameters.
     * @param {string} params.taxonomyUuid - Taxonomy uuid.
     * @param {string} params.taxonCode - Code.
     * @returns {Promise<object|null>} The taxon.
     */
    getTaxonByCode: async ({ taxonomyUuid, taxonCode }: { taxonomyUuid: string; taxonCode: string }) => {
      const taxa = await api.findTaxa({ surveyId, taxonomyUuid, filterProp: 'code', filterValue: taxonCode, signal })
      return keepTaxon(findExact(taxa, Taxon.getCode, taxonCode, true))
    },
    /**
     * Finds a taxon by its scientific name (exact, case-insensitive).
     * @param {object} params - Parameters.
     * @param {string} params.taxonomyUuid - Taxonomy uuid.
     * @param {string} params.scientificName - Scientific name.
     * @returns {Promise<object|null>} The taxon.
     */
    findTaxonByScientificName: async ({
      taxonomyUuid,
      scientificName,
    }: {
      taxonomyUuid: string
      scientificName: string
    }) => {
      const taxa = await api.findTaxa({
        surveyId,
        taxonomyUuid,
        filterProp: 'scientificName',
        filterValue: scientificName,
        signal,
      })
      return keepTaxon(findExact(taxa, Taxon.getScientificName, scientificName, true))
    },
    /**
     * Finds a taxon by uuid: the survey index, then the taxa found before.
     * @param {object} params - Parameters.
     * @param {object} params.survey - The survey.
     * @param {string} params.taxonUuid - Taxon uuid.
     * @returns {Promise<object|null>} The taxon.
     */
    getTaxonByUuid: async ({ survey, taxonUuid }: { survey: any; taxonUuid: string }) =>
      Survey.getTaxonByUuid(taxonUuid)(survey) ?? taxaByUuid.get(taxonUuid) ?? null,
  }

  return { categoryItemProvider, taxonProvider }
}
