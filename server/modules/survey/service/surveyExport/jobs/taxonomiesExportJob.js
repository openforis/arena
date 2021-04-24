import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import { ExportFile } from '../exportFile'

export default class TaxonomiesExportJob extends Job {
  constructor(params) {
    super('TaxonomiesExportJob', params)
  }

  async execute() {
    const { archive, backup, draft, surveyId } = this.context

    // taxonomies.json: list of all categories with levels
    const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId, draft, backup })
    archive.append(JSON.stringify(taxonomies, null, 2), { name: ExportFile.taxonomies })

    this.total = taxonomies.length

    // for each taxonomy create a  `${taxonomy}.json` file with the taxa
    await PromiseUtils.each(taxonomies, async (taxonomy) => {
      const taxonomyUuid = taxonomy.uuid
      const taxaData = await TaxonomyService.fetchTaxaWithVernacularNames({
        surveyId,
        taxonomyUuid,
        draft,
        backup,
      })
      archive.append(JSON.stringify(taxaData, null, 2), {
        name: ExportFile.taxa({ taxonomyUuid }),
      })
      this.incrementProcessedItems()
    })
  }
}
