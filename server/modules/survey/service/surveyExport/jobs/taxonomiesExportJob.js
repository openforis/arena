import { ArrayUtils } from '@core/arrayUtils'
import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import { ExportFile } from '../exportFile'

const taxaBatchSize = 10000
const draft = true // always include draft taxonomies

export default class TaxonomiesExportJob extends Job {
  constructor(params) {
    super('TaxonomiesExportJob', params)
  }

  async execute() {
    const { archive, backup, surveyId } = this.context

    // taxonomies.json: list of all categories with levels
    const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId, backup, draft }, this.tx)
    archive.append(JSON.stringify(taxonomies, null, 2), { name: ExportFile.taxonomies })

    this.total = taxonomies.length

    // for each taxonomy create a  `${taxonomy}.json` file with the taxa
    await PromiseUtils.each(taxonomies, async (taxonomy) => {
      await this.exportTaxonomy({ taxonomy })
    })
  }

  async exportTaxonomy({ taxonomy }) {
    const { archive, backup, surveyId } = this.context

    const taxonomyUuid = taxonomy.uuid
    const taxaCount = await TaxonomyService.countTaxaByTaxonomyUuid(surveyId, taxonomyUuid, draft, this.tx)
    const totalPages = Math.ceil(taxaCount / taxaBatchSize)
    const pageIndexes = ArrayUtils.fromNumberOfElements(totalPages)

    for await (const pageIndex of pageIndexes) {
      const offset = pageIndex * taxaBatchSize
      const taxaData = await TaxonomyService.fetchTaxaWithVernacularNames(
        { surveyId, taxonomyUuid, backup, draft, offset, limit: taxaBatchSize },
        this.tx
      )
      const fileName =
        totalPages === 1 ? ExportFile.taxa({ taxonomyUuid }) : ExportFile.taxaPart({ taxonomyUuid, index: pageIndex })

      archive.append(JSON.stringify(taxaData, null, 2), { name: fileName })
    }
    this.incrementProcessedItems()
  }
}
