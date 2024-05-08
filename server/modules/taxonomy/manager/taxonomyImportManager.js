import * as R from 'ramda'

import BatchPersister from '@server/db/batchPersister'

import * as ObjectUtils from '@core/objectUtils'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Validation from '@core/validation/validation'

import * as TaxonomyManager from './taxonomyManager'
import { TaxonComparator } from './taxonComparator'

const createPredefinedTaxa = (taxonomy) => [
  Taxon.newTaxon({
    taxonomyUuid: Taxonomy.getUuid(taxonomy),
    code: Taxon.unknownCode,
    family: 'Unknown',
    genus: 'Unknown',
    scientificName: 'Unknown',
  }),
  Taxon.newTaxon({
    taxonomyUuid: Taxonomy.getUuid(taxonomy),
    code: Taxon.unlistedCode,
    family: 'Unlisted',
    genus: 'Unlisted',
    scientificName: 'Unlisted',
  }),
]

export default class TaxonomyImportManager {
  constructor({ user, surveyId, taxonomy, vernacularLanguageCodes, extraPropsDefs, tx }) {
    this.user = user
    this.surveyId = surveyId
    this.taxonomy = taxonomy
    this.vernacularLanguageCodes = vernacularLanguageCodes
    this.extraPropsDefs = extraPropsDefs
    this.tx = tx

    this.batchPersisterInsert = new BatchPersister(async (taxa) =>
      TaxonomyManager.insertTaxa({ user: this.user, surveyId: this.surveyId, taxa, client: this.tx })
    )
    this.batchPersisterUpdate = new BatchPersister(async (items) =>
      TaxonomyManager.updateTaxa(this.user, this.surveyId, items, this.tx)
    )
    this.insertedCodes = new Set() // Inserted taxa codes
    this.existingTaxaByCode = {} // Existing taxa (indexed by code)
    this.existingTaxaByScientificName = {} // Existing taxa (indexed by scientific name)
  }

  async init() {
    if (this.taxonomy && Taxonomy.isPublished(this.taxonomy)) {
      // Taxa deleted before import for draft taxonomies
      const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames(
        {
          surveyId: this.surveyId,
          taxonomyUuid: Taxonomy.getUuid(this.taxonomy),
          draft: true,
        },
        this.tx
      )

      this.existingTaxaByCode = ObjectUtils.toIndexedObj(taxa, `${Taxon.keys.props}.${Taxon.propKeys.code}`)
      this.existingTaxaByScientificName = ObjectUtils.toIndexedObj(
        taxa,
        `${Taxon.keys.props}.${Taxon.propKeys.scientificName}`
      )
    }
  }

  async updateExistingTaxonWithSameCodeIfAny(taxon) {
    const taxonExisting = this.existingTaxaByCode[Taxon.getCode(taxon)]
    if (!taxonExisting) {
      return false
    }
    // Update existing item
    const taxonUpdated = Taxon.mergeProps(taxon)(taxonExisting)
    if (!TaxonComparator.isTaxonEqual(taxonExisting)(taxonUpdated)) {
      await this.batchPersisterUpdate.addItem(R.omit([Validation.keys.validation], taxonUpdated))
    }
    return true
  }

  checkTaxonCodeHasNotChanged(taxon) {
    const scientificName = Taxon.getScientificName(taxon)
    const taxonWithSameScientificName = this.existingTaxaByScientificName[scientificName]
    if (taxonWithSameScientificName) {
      const oldCode = Taxon.getCode(taxonWithSameScientificName)
      const newCode = Taxon.getCode(taxon)
      if (oldCode !== newCode) {
        return {
          key: Validation.messageKeys.taxonomyEdit.codeChangedAfterPublishing,
          params: {
            oldCode,
            newCode,
            scientificName,
          },
        }
      }
    }
    return null
  }

  async addTaxonToUpdateBuffer(taxon) {
    if (await this.updateExistingTaxonWithSameCodeIfAny(taxon)) {
      return { success: true }
    }

    const error = this.checkTaxonCodeHasNotChanged(taxon)
    if (error) {
      return { success: false, error }
    }

    // Insert new one
    await this.batchPersisterInsert.addItem(R.omit([Validation.keys.validation], taxon))

    this.insertedCodes.add(Taxon.getCode(taxon))

    return { success: true }
  }

  async finalizeImport() {
    const { user, surveyId } = this

    // Insert predefined taxa (UNL - UNK)
    const predefinedTaxaToInsert = R.pipe(
      createPredefinedTaxa,
      R.filter((taxon) => !this.insertedCodes.has(Taxon.getCode(taxon)))
    )(this.taxonomy)

    await Promise.all(predefinedTaxaToInsert.map((predefinedTaxon) => this.addTaxonToUpdateBuffer(predefinedTaxon)))

    await this.batchPersisterInsert.flush()
    await this.batchPersisterUpdate.flush()

    // Set vernacular lang codes in taxonomy
    await TaxonomyManager.updateTaxonomyProp(
      user,
      surveyId,
      Taxonomy.getUuid(this.taxonomy),
      Taxonomy.keysProps.vernacularLanguageCodes,
      this.vernacularLanguageCodes,
      true,
      this.tx
    )

    // cleanup extra props defs (remove originalHeader prop)
    const extraPropsDefsCleaned = Object.entries(this.extraPropsDefs).reduce((extraPropsDefsAcc, [key, extraProp]) => {
      const extraPropProps = { ...extraProp }
      delete extraPropProps['originalHeader']
      extraPropsDefsAcc[key] = extraPropProps
      return extraPropsDefsAcc
    }, {})

    await TaxonomyManager.updateTaxonomyProp(
      user,
      surveyId,
      Taxonomy.getUuid(this.taxonomy),
      Taxonomy.keysProps.extraPropsDefs,
      extraPropsDefsCleaned,
      true,
      this.tx
    )
  }
}
