import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { Objects } from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Survey from '@core/survey/survey'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import * as SurveyFile from '@core/survey/surveyFile'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyService from '@server/modules/survey/service/surveyService'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'
import * as SB from '../../utils/surveyBuilder'

// The area of interest is stored as survey file: the server reads it only where records are evaluated.

const areaOfInterest = {
  type: 'Polygon',
  coordinates: [
    [
      [12.48, 41.88],
      [12.5, 41.88],
      [12.5, 41.9],
      [12.48, 41.9],
      [12.48, 41.88],
    ],
  ],
}

const fetchSurvey = ({ surveyId, includeAreaOfInterest }) =>
  SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
    surveyId,
    draft: true,
    advanced: true,
    includeAreaOfInterest,
  })

const evaluateDistance = async ({ survey, record, location }) => {
  const locationNode = RecordUtils.findNodeByPath('report/location')(survey, record)
  const nodesUpdated = { [Node.getUuid(locationNode)]: Node.assocValue(location)(locationNode) }
  const { record: recordUpdated } = await RecordManager.updateNodesDependents({
    survey,
    record: Record.mergeNodes(nodesUpdated)(record),
    nodes: nodesUpdated,
  })
  return Node.getValue(RecordUtils.findNodeByPath('report/aoi_distance')(survey, recordUpdated))
}

describe('Survey area of interest', () => {
  let survey = null
  let record = null
  let tempDir = null

  beforeAll(async () => {
    const user = getContextUser()
    const content = Buffer.from(JSON.stringify(areaOfInterest))
    const file = SurveyFile.createFile({
      type: SurveyFile.SurveyFileType.areaOfInterest,
      name: 'aoi.geojson',
      size: content.length,
      content,
    })
    survey = await SB.survey(
      user,
      SB.entity(
        'report',
        SB.attribute('report_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('location', NodeDef.nodeDefType.coordinate),
        SB.attribute('aoi_distance', NodeDef.nodeDefType.decimal)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'geoDistanceToAOIBoundary(location)' }))
      )
    )
      .props({
        [Survey.infoKeys.areaOfInterestFile]: SurveyAreaOfInterest.newAreaOfInterestFileDescriptor({
          fileUuid: SurveyFile.getUuid(file),
          name: 'aoi.geojson',
          size: content.length,
          areaOfInterest,
        }),
      })
      .buildAndStore()
    await SurveyFileManager.insertFile(Survey.getId(survey), file)
    record = await RB.record(user, survey, RB.entity('report', RB.attribute('report_id', 1))).buildAndStore()
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'aoi-test-'))
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
    if (tempDir) await rm(tempDir, { recursive: true, force: true })
  })

  test('area of interest read from its file when evaluating records', async () => {
    const surveyWithAreaOfInterest = await fetchSurvey({ surveyId: Survey.getId(survey), includeAreaOfInterest: true })

    const distanceInside = await evaluateDistance({
      survey: surveyWithAreaOfInterest,
      record,
      location: { x: 12.49, y: 41.89, srs: '4326' },
    })
    expect(distanceInside).toBeLessThan(0)

    const distanceOutside = await evaluateDistance({
      survey: surveyWithAreaOfInterest,
      record,
      location: { x: 12.51, y: 41.89, srs: '4326' },
    })
    expect(distanceOutside).toBeGreaterThan(0)
  })

  test('area of interest not loaded by default', async () => {
    const surveyFetched = await fetchSurvey({ surveyId: Survey.getId(survey), includeAreaOfInterest: false })
    expect(Survey.getSurveyInfo(surveyFetched).props.areaOfInterest).toBeUndefined()
    const distance = await evaluateDistance({
      survey: surveyFetched,
      record,
      location: { x: 12.49, y: 41.89, srs: '4326' },
    })
    // the function returns null: no value is set
    expect(Objects.isEmpty(distance)).toBe(true)
  })

  test('upload of an area of interest file without a valid polygon is rejected', async () => {
    const filePath = path.join(tempDir, 'point.geojson')
    await writeFile(filePath, JSON.stringify({ type: 'Point', coordinates: [12.49, 41.89] }))
    const surveyFile = SurveyFile.createFile({
      type: SurveyFile.SurveyFileType.areaOfInterest,
      name: 'point.geojson',
      temporary: true,
    })
    await expect(
      SurveyService.insertSurveyFile({ surveyId: Survey.getId(survey), filePath, surveyFile })
    ).rejects.toThrow()
    expect(
      await SurveyFileManager.fetchFileSummaryByUuid(Survey.getId(survey), SurveyFile.getUuid(surveyFile))
    ).toBeNull()
  })
})
