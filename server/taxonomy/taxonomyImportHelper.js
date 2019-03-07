const R = require('ramda')

const Taxonomy = require('../../common/survey/taxonomy')

const TaxonomyManager = require('./taxonomyManager')

const taxaInsertBufferSize = 500

const createPredefinedTaxa = (taxonomy) => [
  Taxonomy.newTaxon(taxonomy.uuid, Taxonomy.unknownCode, 'Unknown', 'Unknown', 'Unknown'),
  Taxonomy.newTaxon(taxonomy.uuid, Taxonomy.unlistedCode, 'Unlisted', 'Unlisted', 'Unlisted')
]

class TaxonomyImportHelper {
  constructor (user, surveyId, vernacularLanguageCodes) {
    this.user = user
    this.surveyId = surveyId
    this.vernacularLanguageCodes = vernacularLanguageCodes

    this.taxaInsertBuffer = []
    this.insertedCodes = {} //cache of inserted taxa codes
  }

  async addTaxonToInsertBuffer (taxon, t) {
    this.taxaInsertBuffer.push(R.omit(['validation'], taxon))

    this.insertedCodes[Taxonomy.getTaxonCode(taxon)] = true

    if (this.taxaInsertBuffer.length === taxaInsertBufferSize) {
      await this.flushTaxaInsertBuffer(t)
    }
  }

  async flushTaxaInsertBuffer (t) {
    if (this.taxaInsertBuffer.length > 0) {
      await TaxonomyManager.insertTaxa(this.surveyId, this.taxaInsertBuffer, this.user, t)
      this.taxaInsertBuffer.length = 0
    }
  }

  async finalizeImport (taxonomy, t) {
    const { user, surveyId } = this

    await this.flushTaxaInsertBuffer(t)

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

module.exports = TaxonomyImportHelper