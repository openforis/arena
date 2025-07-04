import { Points } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SamplingPolygon from '@core/survey/SamplingPolygon'
import { GeoJsonUtils } from '@core/geo/geoJsonUtils'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileUtils from '@server/utils/file/fileUtils'

const generateLocationGeoJson = ({ survey, longitude, latitude }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (Survey.isSampleBasedImageInterpretationEnabled(surveyInfo)) {
    const samplingPolygon = Survey.getSamplingPolygon(surveyInfo)
    const isCircle = SamplingPolygon.isCircle(samplingPolygon)
    if (isCircle) {
      const radius = SamplingPolygon.getRadius(samplingPolygon)
      return GeoJsonUtils.circle({ longitude, latitude, radius })
    } else {
      return GeoJsonUtils.rectangle({ latitude, longitude, ...samplingPolygon })
    }
  } else {
    // default 100mx100m square
    return GeoJsonUtils.rectangle({ latitude, longitude })
  }
}

export class GeoJsonCoordinateFeaturesGenerationJob extends Job {
  constructor(params) {
    super(GeoJsonCoordinateFeaturesGenerationJob.type, params)
  }

  async onStart() {
    await super.onStart()

    const { context, tx } = this
    const { surveyId } = context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }, tx)
    this.setContext({ survey })
  }

  async execute() {
    const { context, user } = this
    const { attributeDefUuid, cycle, surveyId, survey } = context

    const srsIndex = Survey.getSRSIndex(survey)
    const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
    const nodeDefParent = Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey)
    const ancestorKeyDefs = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)

    const query = Query.create({
      entityDefUuid: NodeDef.getUuid(nodeDefParent),
      attributeDefUuids: [...ancestorKeyDefs.map(NodeDef.getUuid), attributeDefUuid],
    })

    const rows = await SurveyRdbService.fetchViewData({ user, surveyId, cycle, query })
    const features = []
    rows.forEach((row) => {
      const pointStr = row[NodeDef.getName(attributeDef)]
      const point = Points.parse(pointStr)
      const pointLatLng = Points.toLatLong(point, srsIndex)
      if (pointLatLng) {
        const { x: longitude, y: latitude } = pointLatLng
        features.push(generateLocationGeoJson({ survey, longitude, latitude }))
      }
    })
    const geoJson = GeoJsonUtils.featureCollection({ features })
    const tempFileName = FileUtils.newTempFileName()
    const tempFilePath = FileUtils.tempFilePath(tempFileName)
    await FileUtils.writeFile(tempFilePath, JSON.stringify(geoJson, null, 2))
    this.setContext({ tempFileName })
  }

  generateResult() {
    const { context } = this
    const { tempFileName } = context
    return { tempFileName }
  }
}

GeoJsonCoordinateFeaturesGenerationJob.type = 'GeoJsonCoordinateFeaturesGenerationJob'
