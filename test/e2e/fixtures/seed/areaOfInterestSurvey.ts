import type { AreaOfInterest } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Survey from '@core/survey/survey'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import * as SurveyFile from '@core/survey/surveyFile'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as SB from '@test/utils/surveyBuilder'

// pilot area (WGS84) around the location set as browser geolocation in the Playwright config
export const areaOfInterest: AreaOfInterest = {
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

export const aoiStatusMessages = {
  outside: 'Report outside the pilot area',
  uncertain: 'Improve the GPS accuracy of the location',
}

const warning = ({ expression, message }: { expression: string; message: string }) =>
  NodeDefExpression.createExpression({ expression, severity: 'warning', messages: { en: message } })

/**
 * Inserts a "citizen report" survey (location, distance to the area of interest boundary and location status)
 * with the area of interest defined, owned by the specified user and set as its current survey.
 * @param {object} params - Parameters.
 * @param {string} params.userEmail - Email of the survey owner.
 * @param {string} params.name - Survey name.
 * @param {string} params.label - Survey label.
 * @returns {Promise<number>} - The id of the survey inserted.
 */
export const insertAreaOfInterestSurvey = async ({
  userEmail,
  name,
  label,
}: {
  userEmail: string
  name: string
  label: string
}): Promise<number> => {
  const user = await UserManager.fetchUserByEmail(userEmail)

  const rootBuilder = SB.entity(
    'report',
    SB.attribute('report_id', NodeDef.nodeDefType.integer).label('Report id').key(),
    SB.attribute('location', NodeDef.nodeDefType.coordinate)
      .label('Location')
      .prop(NodeDef.propKeys.includeAccuracy, true),
    SB.attribute('aoi_distance', NodeDef.nodeDefType.decimal)
      .label('Distance to the pilot area boundary (m)')
      .readOnly()
      .defaultValues(
        NodeDefExpression.createExpression({ expression: 'Math.round(geoDistanceToAOIBoundary(location))' })
      ),
    SB.attribute('aoi_status', NodeDef.nodeDefType.text)
      .label('Location status')
      .readOnly()
      .defaultValues(
        NodeDefExpression.createExpression({ expression: `'inside'`, applyIf: 'aoi_distance < -location.accuracy' }),
        NodeDefExpression.createExpression({ expression: `'outside'`, applyIf: 'aoi_distance > location.accuracy' }),
        NodeDefExpression.createExpression({
          expression: `'uncertain'`,
          applyIf: 'Math.abs(aoi_distance) <= location.accuracy',
        })
      )
      .expressions(
        warning({ expression: `aoi_status != 'outside'`, message: aoiStatusMessages.outside }),
        warning({ expression: `aoi_status != 'uncertain'`, message: aoiStatusMessages.uncertain })
      )
  )
    .label('Report')
    .displayInOwnPage()

  // the area of interest is stored as survey file, referenced by the survey info
  const content = Buffer.from(JSON.stringify(areaOfInterest))
  const fileName = 'pilot_area.geojson'
  const areaOfInterestFile = SurveyFile.createFile({
    type: SurveyFile.SurveyFileType.areaOfInterest,
    name: fileName,
    size: content.length,
    content,
  })
  const surveyBuilder = SB.survey(user, rootBuilder).props({
    [Survey.infoKeys.areaOfInterestFile]: SurveyAreaOfInterest.newAreaOfInterestFileDescriptor({
      fileUuid: SurveyFile.getUuid(areaOfInterestFile),
      name: fileName,
      size: content.length,
      areaOfInterest,
    }),
  })
  surveyBuilder.name = name
  surveyBuilder.label = label

  const survey = await surveyBuilder.buildAndStore(true)
  const surveyId = Number(Survey.getId(survey))
  await SurveyFileManager.insertFile(surveyId, areaOfInterestFile)
  return surveyId
}
