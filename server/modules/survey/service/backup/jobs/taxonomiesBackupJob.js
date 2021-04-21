import Job from '@server/job/job'
import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class TaxonomiesBackupJob extends Job {
  constructor(params) {
    super('TaxonomiesBackupJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    // taxonomies.json: list of all categories with levels
    const taxonomiesPathDir = 'taxonomies'
    const taxonomiesPathFile = FileUtils.join(taxonomiesPathDir, 'taxonomies.json')
    const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId, draft: true, backup: true })
    archive.append(JSON.stringify(taxonomies, null, 2), { name: taxonomiesPathFile })

    // for each taxonomy create a  `${taxonomy}.json` file with the taxa
    await Promise.all(
      taxonomies.map(async (taxonomy) => {
        const taxaData = await TaxonomyService.fetchTaxaWithVernacularNames({
          surveyId,
          taxonomyUuid: taxonomy.uuid,
          draft: true,
          backup: true,
        })
        archive.append(JSON.stringify(taxaData, null, 2), {
          name: FileUtils.join(taxonomiesPathDir, `${taxonomy.uuid}.json`),
        })
      })
    )
  }
}
