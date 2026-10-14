import * as ActivityLog from '@common/activityLog/activityLog'

import * as Category from '@core/survey/category'
import { SurveyCompareApplyPlan, buildApplyPlan, compareSurveys } from '@core/survey/surveyCompare'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as DbUtils from '@server/db/dbUtils'

import { fetchTargetSurvey, readSurveyFromFile } from './surveyCompareSurveysReader'

/**
 * Applies the selected changes of a survey comparison to the survey with the specified id.
 * Changes are written as draft: they reach the records only when the survey is published.
 */
export default class SurveyCompareApplyJob extends Job {
  static readonly type = 'SurveyCompareApplyJob'

  /**
   * Creates the job.
   * @param {object} params - The parameters.
   * @param {object} params.user - The user running the job.
   * @param {number} params.surveyId - Id of the survey to update.
   * @param {string} params.sourceFileName - Temp file name of the uploaded survey file.
   * @param {string[]} params.selectedIds - Ids of the changes to apply.
   */
  constructor(params?: any) {
    super(SurveyCompareApplyJob.type, params)
  }

  async execute() {
    const { surveyId, sourceFileName, selectedIds = [] }: any = this.context
    FileUtils.checkIsValidTempFileName(sourceFileName)

    const { survey: sourceSurvey, itemsByCategoryUuid: sourceItemsByCategoryUuid } = await readSurveyFromFile({
      filePath: FileUtils.tempFilePath(sourceFileName),
    })
    // the comparison is computed again: the survey could have been changed in the meantime
    const {
      survey: targetSurvey,
      itemsByCategoryUuid: targetItemsByCategoryUuid,
      usedNodeDefUuids,
    } = await fetchTargetSurvey({ surveyId }, this.tx)
    const params = { sourceSurvey, targetSurvey, sourceItemsByCategoryUuid, targetItemsByCategoryUuid }
    const result = compareSurveys(params)
    const plan = buildApplyPlan({ ...params, result, selectedIds, usedNodeDefUuids })

    this.total = plan.appliedIds.length

    await this.applyCategoriesChanges(plan)
    await this.applyNodeDefsChanges(plan)

    if (plan.appliedIds.length > 0) {
      await SurveyRepository.markSurveyDraft(surveyId, this.tx)
      await CategoryManager.validateCategories(targetSurvey, this.tx)
    }
    this.processed = plan.appliedIds.length
    this.setContext({ appliedIds: plan.appliedIds, skippedIds: plan.skippedIds })
  }

  async applyCategoriesChanges(plan: SurveyCompareApplyPlan) {
    const { user, surveyId }: any = this.context
    const tx = this.tx
    const activities = []
    const categoryUuidsWithInsertedItems = new Set<string>()

    for (const { category, items } of plan.categoriesToInsert) {
      await CategoryManager.insertCategory({ user, surveyId, category, addLogs: false, validate: false }, tx) // NOSONAR
      await CategoryManager.insertItemsInBatch({ surveyId, items }, tx) // NOSONAR
      categoryUuidsWithInsertedItems.add(Category.getUuid(category))
      activities.push(ActivityLog.newActivity(ActivityLog.type.categoryInsert, category))
    }
    for (const { categoryUuid, key, value } of plan.categoryPropsToUpdate) {
      await CategoryRepository.updateCategoryProp(surveyId, categoryUuid, key, value, tx) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.categoryPropUpdate, { uuid: categoryUuid, key, value }))
    }
    for (const { categoryUuid, items } of plan.categoryItemsToInsert) {
      await CategoryManager.insertItemsInBatch({ surveyId, items }, tx) // NOSONAR
      categoryUuidsWithInsertedItems.add(categoryUuid)
    }
    for (const { items } of plan.categoryItemsToUpdate) {
      await CategoryRepository.updateItemsProps({ surveyId, items }, tx) // NOSONAR
    }
    await DbUtils.runQueries(
      tx,
      [...categoryUuidsWithInsertedItems].map((categoryUuid) => async () => {
        const category = await CategoryRepository.fetchCategoryAndLevelsByUuid(
          { surveyId, categoryUuid, draft: true },
          tx
        )
        await CategoryManager.initializeSurveyCategoryItemsIndexes({ surveyId, category }, tx)
      })
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  }

  async applyNodeDefsChanges(plan: SurveyCompareApplyPlan) {
    const { user, surveyId }: any = this.context
    const tx = this.tx
    const activities = []

    if (plan.nodeDefsToInsert.length > 0) {
      await NodeDefRepository.insertNodeDefsBatch({ surveyId, nodeDefs: plan.nodeDefsToInsert }, tx)
      activities.push(
        ...plan.nodeDefsToInsert.map((nodeDef) => ActivityLog.newActivity(ActivityLog.type.nodeDefCreate, nodeDef))
      )
    }
    for (const { nodeDefUuid, parentUuid, type, props, propsAdvanced } of plan.nodeDefsToUpdate) {
      if (type) {
        await NodeDefRepository.updateNodeDefTypeAndProps({ surveyId, nodeDefUuid, type, props, propsAdvanced }, tx) // NOSONAR
      } else {
        await NodeDefRepository.updateNodeDefProps({ surveyId, nodeDefUuid, parentUuid, props, propsAdvanced }, tx) // NOSONAR
      }
      activities.push(
        ActivityLog.newActivity(ActivityLog.type.nodeDefUpdate, { uuid: nodeDefUuid, props, propsAdvanced })
      )
    }
    await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  }

  generateResult(): Promise<any> {
    const { appliedIds = [], skippedIds = [] }: any = this.context
    return Promise.resolve({ appliedIds, skippedIds })
  }
}
