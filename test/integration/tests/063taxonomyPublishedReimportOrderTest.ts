import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as TaxonomyUtils from './_taxonomy/taxonomyUtils'

// Re-importing a file into a published taxonomy changes the order of its taxa (e.g. to show the most frequent ones
// first in Arena Mobile): the new order is applied when the survey is published.

const taxonomyName = 'trees'
const publishedCodes = ['ALB', 'AFZ', 'OLE']

let survey: any = null
let taxonomyUuid: string = null
let tempDir: string = null

const fetchTaxaCodes = async ({ draft }: { draft: boolean }) => {
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames({
    surveyId: Survey.getId(survey),
    taxonomyUuid,
    draft,
  })
  return taxa.map(Taxon.getCode).filter(Boolean)
}

// taxa as sent to Arena Mobile
const fetchRefDataTaxaCodes = async () => {
  const surveyPublished = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId: Survey.getId(survey),
    draft: false,
  })
  return Object.values(surveyPublished.refData.taxonIndex)
    .filter((taxon) => Taxon.getTaxonomyUuid(taxon) === taxonomyUuid)
    .map(Taxon.getCode)
    .filter(Boolean)
}

const importTaxa = async (rows: string[][]) => {
  const filePath = path.join(tempDir, 'taxa.csv')
  const lines = [['code', 'family', 'genus', 'scientific_name'], ...rows].map((row) => row.join(','))
  fs.writeFileSync(filePath, lines.join('\n'))
  const job = new TaxonomyImportJob({ user: getContextUser(), surveyId: Survey.getId(survey), taxonomyUuid, filePath })
  await job.start()
  if (!job.isSucceeded()) throw new Error(`taxonomy import failed: ${JSON.stringify(job.errors)}`)
  return job
}

describe('Published taxonomy re-import order', () => {
  beforeAll(async () => {
    const user = getContextUser()
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arena-taxonomy-order-'))

    survey = await SB.survey(
      user,
      SB.entity(
        'tree',
        SB.attribute('tree_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('tree_species', NodeDef.nodeDefType.taxon).taxonomy(taxonomyName)
      )
    )
      .taxonomies(
        SB.taxonomy(taxonomyName).taxa(
          SB.taxon('ALB', 'Fabaceae', 'Albizia', 'Albizia glaberrima'),
          SB.taxon('AFZ', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis'),
          SB.taxon('OLE', 'Oleacea', 'Olea', 'Olea capensis')
        )
      )
      .buildAndStore()

    taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(Survey.getId(survey), taxonomyName, true)
    await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('taxa follow the file order, the published ones not in the file go after them', async () => {
    const job = await importTaxa([
      ['OLE', 'Oleacea', 'Olea', 'Olea capensis'],
      ['NEW', 'Pinaceae', 'Pinus', 'Pinus sp.'],
      ['ALB', 'Fabaceae', 'Albizia', 'Albizia glaberrima'],
    ])
    expect(job.result.missingPublishedTaxaCodes).toEqual(['AFZ'])

    const expectedOrder = ['OLE', 'NEW', 'ALB', 'AFZ', Taxon.unknownCode, Taxon.unlistedCode]
    expect(await fetchTaxaCodes({ draft: true })).toEqual(expectedOrder)

    // published order unchanged until the survey is published
    expect(await fetchTaxaCodes({ draft: false })).toEqual(publishedCodes)

    await SurveyUtils.publishSurvey(getContextUser(), Survey.getId(survey))

    expect(await fetchTaxaCodes({ draft: false })).toEqual(expectedOrder)
    expect(await fetchRefDataTaxaCodes()).toEqual(expectedOrder)
  })
})
