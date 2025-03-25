import * as Taxonomy from '@core/survey/taxonomy'
import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

/**
 * Inserts a taxonomy for each taxonomy
 * Saves the list of inserted taxonomies in the "taxonomies" context property.
 */
export default class TaxonomiesImportJob extends Job {
  constructor(params) {
    super('TaxonomiesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip } = this.context

    const taxonomies = await ArenaSurveyFileZip.getTaxonomies(arenaSurveyFileZip)
    this.total = taxonomies.length

    await PromiseUtils.each(taxonomies, async (taxonomy) => {
      if (!this.isCanceled()) {
        await this._insertTaxonomy({ taxonomy })
        this.incrementProcessedItems()
      }
    })

    this.setContext({ taxonomies })
  }

  async _insertTaxonomy({ taxonomy }) {
    const { arenaSurveyFileZip: zipFile, backup, surveyId } = this.context

    const taxonomyImported = await TaxonomyManager.insertTaxonomy(
      {
        user: this.user,
        surveyId,
        taxonomy,
        addLogs: false,
        backup,
      },
      this.tx
    )
    const taxonomyUuid = Taxonomy.getUuid(taxonomyImported)
    let taxa = await ArenaSurveyFileZip.getTaxa(zipFile, taxonomyUuid)
    if (taxa.length > 0) {
      await this.insertTaxa({ taxa })
    } else {
      const partsCount = ArenaSurveyFileZip.getTaxaPartsCount({ zipFile, taxonomyUuid })
      let partIndex = 0
      while (partIndex < partsCount) {
        taxa = await ArenaSurveyFileZip.getTaxaPart({ zipFile, taxonomyUuid, index: partIndex })
        await this.insertTaxa({ taxa })
        partIndex = partIndex + 1
      }
    }
  }

  async insertTaxa({ taxa }) {
    const { backup, surveyId } = this.context
    await TaxonomyManager.insertTaxa({ user: this.user, surveyId, taxa, addLogs: false, backup, client: this.tx })
  }
}
