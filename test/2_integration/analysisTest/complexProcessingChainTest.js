import { expect } from 'chai'
import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as PromiseUtils from '@core/promiseUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser } from '../../testContext'
import * as SurveyUtils from '../utils/surveyUtils'
import * as SB from '../utils/surveyBuilder'
import * as RB from '../utils/recordBuilder'
import * as ChainBuilder from '../utils/chainBuilder'

let user = null
let survey = null
let records = []

before(async () => {
  user = getContextUser()

  survey = await SB.survey(
    user,
    // Cluster
    SB.entity(
      'cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),

      // --> plot
      SB.entity(
        'plot',
        SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),

        // --> tree
        SB.entity(
          'tree',
          SB.attribute('tree_no', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_dbh', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_height', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_volume', NodeDef.nodeDefType.decimal).analysis(),

          // --> tree virtual
          SB.entity('tree_virtual').virtual()
        ).multiple()
      ).multiple()
    )
  ).buildAndStore(false)
})

after(async () => {
  if (survey) {
    await SurveyManager.deleteSurvey(Survey.getId(survey))
  }
})

const _insertRecords = async () => {
  // Delete records
  await Promise.all(records.map((record) => RecordManager.deleteRecord(user, survey, Record.getUuid(record))))

  records = []

  const newTree = (treeNo, dbh, height) =>
    RB.entity(
      'tree',
      RB.attribute('tree_no', treeNo),
      RB.attribute('tree_dbh', dbh),
      RB.attribute('tree_height', height)
    )

  // Add 5 records
  await PromiseUtils.each([1, 2, 3, 4, 5], async (clusterNum) => {
    const record = await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', clusterNum),
        RB.entity('plot', RB.attribute('plot_no', 1), newTree(1, 20, 50), newTree(2, 30, 60))
      )
    ).buildAndStore()

    records.push(record)
  })
}

export const chainWithSimpleEntityTest = async () => {
  await ChainBuilder.chain(
    user,
    survey,
    'Chain with simple entity',
    ChainBuilder.step('tree', ChainBuilder.calculation('tree_volume', 'Tree volume calculation'))
  ).buildAndStore()

  await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  await _insertRecords()

  // No aggregated views expected
  const entityAggregatedViews = await SurveyRdbManager.getEntityAggregatedViews(survey)
  expect(R.isEmpty(entityAggregatedViews)).to.equal(true)
}

export const chainWithVirtualEntityTest = async () => {
  await ChainBuilder.chain(
    user,
    survey,
    'Chain with virtual entity',
    ChainBuilder.step(
      'tree_virtual',
      ChainBuilder.calculation('tree_volume', 'Tree volume calculation').formula('tree_dbh * tree_height')
    )
  ).buildAndStore()

  await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  await _insertRecords()

  // No aggregated views expected
  const entityAggregatedViews = await SurveyRdbManager.getEntityAggregatedViews(survey)
  expect(R.isEmpty(entityAggregatedViews)).to.equal(true)
}

export const chainWithVirtualEntityAndAggregationTest = async () => {
  await ChainBuilder.chain(
    user,
    survey,
    'Chain with virtual entity and aggreagation',
    ChainBuilder.step(
      'tree_virtual',
      ChainBuilder.calculation('tree_volume', 'Tree volume calculation').aggregateFn(
        ProcessingStepCalculation.aggregateFn.sum
      )
    )
  ).buildAndStore()

  await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  await _insertRecords()

  // One aggregated view expected
  const entityAggregatedViews = await SurveyRdbManager.getEntityAggregatedViews(survey)
  expect(R.isEmpty(entityAggregatedViews)).to.equal(false)
}
