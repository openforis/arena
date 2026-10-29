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
import { AreaOfInterestProviderDefault } from '@server/modules/survey/manager/areaOfInterestProviderDefault'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyService from '@server/modules/survey/service/surveyService'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'
import * as SB from '../../utils/surveyBuilder'

// The areas of interest are stored as survey files: the server provider reads them when records are evaluated.

const polygon = ({ west, east }) => ({
  type: 'Polygon',
  coordinates: [
    [
      [west, 41.88],
      [east, 41.88],
      [east, 41.9],
      [west, 41.9],
      [west, 41.88],
    ],
  ],
})

const areas = { west: polygon({ west: 12.48, east: 12.49 }), east: polygon({ west: 12.49, east: 12.5 }) }

const createAreaOfInterestFile = ({ name, areaOfInterest }) => {
  const content = Buffer.from(JSON.stringify(areaOfInterest))
  const file = SurveyFile.createFile({
    type: SurveyFile.SurveyFileType.areaOfInterest,
    name: `${name}.geojson`,
    size: content.length,
    content,
  })
  const descriptor = SurveyAreaOfInterest.newAreaOfInterestDescriptor({
    name,
    fileUuid: SurveyFile.getUuid(file),
    fileName: `${name}.geojson`,
    size: content.length,
    areaOfInterest,
  })
  return { file, descriptor }
}

const fetchSurvey = (surveyId) =>
  SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, draft: true, advanced: true })

const evaluate = async ({ survey, record, location }) => {
  const locationNode = RecordUtils.findNodeByPath('report/location')(survey, record)
  const nodesUpdated = { [Node.getUuid(locationNode)]: Node.assocValue(location)(locationNode) }
  const { record: recordUpdated } = await RecordManager.updateNodesDependents({
    survey,
    record: Record.mergeNodes(nodesUpdated)(record),
    nodes: nodesUpdated,
  })
  const valueOf = (nodePath) => Node.getValue(RecordUtils.findNodeByPath(nodePath)(survey, recordUpdated))
  return { distance: valueOf('report/aoi_distance'), areaName: valueOf('report/aoi_name') }
}

const location = (x) => ({ x, y: 41.89, srs: '4326' })

describe('Survey areas of interest', () => {
  let survey = null
  let record = null
  let tempDir = null

  beforeAll(async () => {
    const user = getContextUser()
    const areaFiles = Object.entries(areas).map(([name, areaOfInterest]) =>
      createAreaOfInterestFile({ name, areaOfInterest })
    )
    const surveyBuilt = await SB.survey(
      user,
      SB.entity(
        'report',
        SB.attribute('report_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('location', NodeDef.nodeDefType.coordinate),
        SB.attribute('aoi_distance', NodeDef.nodeDefType.decimal)
          .readOnly()
          .defaultValues(
            NodeDefExpression.createExpression({ expression: `geoDistanceToAOIBoundary(location, 'east')` })
          ),
        SB.attribute('aoi_name', NodeDef.nodeDefType.text)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'geoAOIContaining(location)' }))
      )
    )
      .props({ [Survey.infoKeys.areasOfInterest]: areaFiles.map(({ descriptor }) => descriptor) })
      .buildAndStore()
    const surveyId = Survey.getId(surveyBuilt)
    for (const { file } of areaFiles) {
      await SurveyFileManager.insertFile(surveyId, file)
    }
    survey = await fetchSurvey(surveyId)
    record = await RB.record(user, survey, RB.entity('report', RB.attribute('report_id', 1))).buildAndStore()
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'aoi-test-'))
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
    if (tempDir) await rm(tempDir, { recursive: true, force: true })
  })

  test('the survey holds only the descriptors', () => {
    const surveyInfo = Survey.getSurveyInfo(survey)
    expect(SurveyAreaOfInterest.getAreaOfInterestNames(surveyInfo)).toEqual(['west', 'east'])
    expect(JSON.stringify(surveyInfo)).not.toContain('coordinates')
  })

  test('distance to a named area and area containing the location', async () => {
    const inEast = await evaluate({ survey, record, location: location(12.495) })
    expect(inEast.distance).toBeLessThan(0)
    expect(inEast.areaName).toBe('east')

    const inWest = await evaluate({ survey, record, location: location(12.485) })
    expect(inWest.distance).toBeGreaterThan(0)
    expect(inWest.areaName).toBe('west')

    const outside = await evaluate({ survey, record, location: location(12.51) })
    expect(outside.distance).toBeGreaterThan(0)
    expect(Objects.isEmpty(outside.areaName)).toBe(true)
  })

  test('the provider caches the geometries', async () => {
    const first = await AreaOfInterestProviderDefault.getAreaOfInterest({ survey, name: 'west' })
    expect(first).toEqual(areas.west)
    expect(await AreaOfInterestProviderDefault.getAreaOfInterest({ survey, name: 'west' })).toBe(first)
    expect(await AreaOfInterestProviderDefault.getAreaOfInterest({ survey, name: 'unknown' })).toBeUndefined()
  })

  test('upload of an area of interest file without a valid polygon is rejected', async () => {
    const surveyId = Survey.getId(survey)
    const filePath = path.join(tempDir, 'point.geojson')
    await writeFile(filePath, JSON.stringify({ type: 'Point', coordinates: [12.49, 41.89] }))
    const surveyFile = SurveyFile.createFile({
      type: SurveyFile.SurveyFileType.areaOfInterest,
      name: 'point.geojson',
      temporary: true,
    })
    await expect(SurveyService.insertSurveyFile({ surveyId, filePath, surveyFile })).rejects.toThrow()
    expect(await SurveyFileManager.fetchFileSummaryByUuid(surveyId, SurveyFile.getUuid(surveyFile))).toBeNull()
  })
})
