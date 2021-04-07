import * as Taxonomy from '@core/survey/taxonomy'

import Job from '@server/job/job'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

const insertTaxonomy = async ({ taxonomy, user, surveyId, arenaSurveyFileZip, tx }) => {
  const taxonomyImported = await TaxonomyManager.insertTaxonomy({ user, surveyId, taxonomy, addLogs: false })
  const taxa = await ArenaSurveyFileZip.getTaxa(arenaSurveyFileZip, Taxonomy.getUuid(taxonomyImported))
  await TaxonomyManager.insertTaxa({ user, surveyId, taxa, addLogs: false }, tx)
}

/**
 * Inserts a taxonomy for each taxonomy
 * Saves the list of inserted taxonomies in the "taxonomies" context property.
 */
export default class TaxonomiesImportJob extends Job {
  constructor(params) {
    super('TaxonomiesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const taxonomies = await ArenaSurveyFileZip.getTaxonomies(arenaSurveyFileZip)

    await Promise.all(
      taxonomies.map(async (taxonomy) =>
        insertTaxonomy({ taxonomy, user: this.user, surveyId, arenaSurveyFileZip, tx: this.tx })
      )
    )

    this.setContext({ taxonomies })
  }
}
