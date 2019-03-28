const R = require('ramda')

const BatchPersister = require('../../../db/batchPersister')

const Taxonomy = require('../../../../common/survey/taxonomy')

const TaxonomyManager = require('./taxonomyManager')

const createPredefinedTaxa = (taxonomy) => [
  Taxonomy.newTaxon(taxonomy.uuid, Taxonomy.unknownCode, 'Unknown', 'Unknown', 'Unknown'),
  Taxonomy.newTaxon(taxonomy.uuid, Taxonomy.unlistedCode, 'Unlisted', 'Unlisted', 'Unlisted')
]

class TaxonomyImportManager {
  constructor (user, surveyId, vernacularLanguageCodes) {
    this.user = user
    this.surveyId = surveyId
    this.vernacularLanguageCodes = vernacularLanguageCodes

    this.batchPersister = new BatchPersister(this.taxaInsertHandler.bind(this))
    this.insertedCodes = {} //cache of inserted taxa codes
  }

  async addTaxonToInsertBuffer (taxon, t) {
    this.batchPersister.addItem(R.omit(['validation'], taxon), t)

    this.insertedCodes[Taxonomy.getTaxonCode(taxon)] = true
  }

  async taxaInsertHandler (items, t) {
    await TaxonomyManager.insertTaxa(this.surveyId, items, this.user, t)
  }

  async finalizeImport (taxonomy, t) {
    const { user, surveyId } = this

    await this.batchPersister.flush(t)

    //set vernacular lang codes in taxonomy
    //set log to false temporarily; set user to null as it's only needed for logging
    await TaxonomyManager.updateTaxonomyProp(user, surveyId, Taxonomy.getUuid(taxonomy),
      'vernacularLanguageCodes', this.vernacularLanguageCodes, t)

    //insert predefined taxa (UNL - UNK)
    const predefinedTaxaToInsert = R.pipe(
      createPredefinedTaxa,
      R.filter(taxon => !this.insertedCodes[Taxonomy.getTaxonCode(taxon)])
    )(taxonomy)

    if (!R.isEmpty(predefinedTaxaToInsert)) {
      await TaxonomyManager.insertTaxa(surveyId, predefinedTaxaToInsert, user, t)
    }
  }
}

module.exports = TaxonomyImportManager