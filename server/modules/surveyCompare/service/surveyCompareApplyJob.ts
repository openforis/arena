import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as SurveyFile from '@core/survey/surveyFile'
import * as ObjectUtils from '@core/objectUtils'
import {
  SurveyCompareApplyPlan,
  SurveyCompareParams,
  buildApplyPlan,
  buildSurveyInfoApplyPlan,
  compareSurveys,
  expandSelection,
} from '@core/survey/surveyCompare'

import Job from '@server/job/job'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as DbUtils from '@server/db/dbUtils'

import { SurveyCompareSource, withSource } from './surveyCompareSource'
import { fetchSurveyFromDb } from './surveyCompareSurveysReader'

/**
 * Applies the selected changes of a survey comparison to the survey with the specified id.
 * Changes are written as draft: they reach the records only when the survey is published.
 * Survey info and survey files are applied first (e.g. new cycles), then the comparison is computed again and the
 * other changes are applied: categories and taxonomies, node defs, then deletions.
 */
export default class SurveyCompareApplyJob extends Job {
  static readonly type = 'SurveyCompareApplyJob'

  /**
   * Creates the job.
   * @param {object} params - The parameters.
   * @param {object} params.user - The user running the job.
   * @param {number} params.surveyId - Id of the survey to update.
   * @param {string} [params.sourceFileId] - Id of the uploaded survey file, kept in the temp storage (source).
   * @param {number} [params.sourceSurveyId] - Id of another survey on this server (source).
   * @param {string[]} params.selectedIds - Ids of the changes to apply.
   * @param {Record<string, string>} [params.manualMatches] - Node defs matched by the user (target uuid by source uuid).
   */
  constructor(params?: any) {
    super(SurveyCompareApplyJob.type, params)
  }

  async execute() {
    const { sourceFileId, sourceSurveyId }: any = this.context
    await withSource({ sourceFileId, sourceSurveyId }, (source) => this.applyChanges(source), this.tx)
  }

  async applyChanges(source: SurveyCompareSource) {
    const { surveyId, selectedIds = [] }: any = this.context
    // the comparison is computed again: the survey could have been changed in the meantime
    let params = await this.fetchCompareParams(source)
    const surveyInfoAppliedIds = await this.applySurveyInfoChanges({ params, selectedIds, source })
    if (surveyInfoAppliedIds.length > 0) {
      // node defs depending on the survey info (e.g. new cycles) can be applied only now
      params = await this.fetchCompareParams(source)
    }
    const { usedNodeDefUuids } = params
    const result = compareSurveys(params)
    const plan = buildApplyPlan({ ...params, result, selectedIds, usedNodeDefUuids })
    const appliedIds = [...new Set([...surveyInfoAppliedIds, ...plan.appliedIds])]
    const skippedIds = plan.skippedIds.filter((id) => !appliedIds.includes(id))

    this.total = appliedIds.length

    await this.applyCategoriesChanges(plan)
    await this.applyTaxonomiesChanges(plan)
    await this.applyNodeDefsChanges(plan)
    await this.applyDeletions(plan)

    if (appliedIds.length > 0) {
      await SurveyRepository.markSurveyDraft(surveyId, this.tx)
      // categories could have been inserted or deleted: validate the updated survey
      const surveyUpdated = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId, draft: true, advanced: true },
        this.tx
      )
      await CategoryManager.validateCategories(surveyUpdated, this.tx)
    }
    this.processed = appliedIds.length
    this.setContext({ appliedIds, skippedIds })
  }

  async fetchCompareParams(source: SurveyCompareSource): Promise<SurveyCompareParams & { usedNodeDefUuids: string[] }> {
    const { surveyId, manualMatches = {} }: any = this.context
    const target = await fetchSurveyFromDb({ surveyId }, this.tx)
    return {
      sourceSurvey: source.survey,
      targetSurvey: target.survey,
      sourceItemsByCategoryUuid: source.itemsByCategoryUuid,
      targetItemsByCategoryUuid: target.itemsByCategoryUuid,
      sourceTaxaByTaxonomyUuid: source.taxaByTaxonomyUuid,
      targetTaxaByTaxonomyUuid: target.taxaByTaxonomyUuid,
      manualMatches,
      usedNodeDefUuids: target.usedNodeDefUuids,
    }
  }

  async applySurveyInfoChanges({ params, selectedIds, source }): Promise<string[]> {
    const { user, surveyId }: any = this.context
    const result = compareSurveys(params)
    const { appliedIds } = expandSelection({ result, selectedIds })
    const plan = buildSurveyInfoApplyPlan({
      sourceSurvey: params.sourceSurvey,
      targetSurvey: params.targetSurvey,
      surveyInfoDiffs: result.surveyInfo,
      surveyFileDiffs: result.surveyFiles,
      appliedIds,
    })
    if (Object.keys(plan.surveyProps).length === 0) return []

    await this.insertSurveyFiles({ files: plan.surveyFilesToInsert, source })
    const targetProps = ObjectUtils.getProps(Survey.getSurveyInfo(params.targetSurvey))
    // the id of the fetched survey is used: the survey name uniqueness check compares ids strictly
    const targetSurveyId = Survey.getId(Survey.getSurveyInfo(params.targetSurvey))
    const surveyUpdated = await SurveyManager.updateSurveyProps(
      user,
      targetSurveyId,
      { ...targetProps, ...plan.surveyProps },
      this.tx
    )
    // when the props are not valid, only the validation is returned
    if (!Survey.getId(Survey.getSurveyInfo(surveyUpdated))) {
      throw new Error(`Invalid survey info: ${JSON.stringify(surveyUpdated.validation)}`)
    }
    await DbUtils.runQueries(
      this.tx,
      plan.surveyFileUuidsToDelete.map(
        (fileUuid) => () => SurveyFileService.deleteFileByUuid({ surveyId, fileUuid }, this.tx)
      )
    )
    const surveyChangeIds = new Set([...result.surveyInfo, ...result.surveyFiles].map((diff) => diff.id))
    return [...appliedIds].filter((id) => surveyChangeIds.has(id))
  }

  async insertSurveyFiles({
    files,
    source,
  }: {
    files: { sourceUuid: string; file: any }[]
    source: SurveyCompareSource
  }) {
    const { surveyId }: any = this.context
    for (const { sourceUuid, file } of files) {
      const content = await source.readSurveyFileContent(sourceUuid) // NOSONAR
      if (!content) {
        throw new Error(`Missing content for survey file ${SurveyFile.getName(file)}`)
      }
      const fileWithContent = SurveyFile.assocSize(Buffer.byteLength(content))(SurveyFile.assocContent(content)(file))
      await SurveyFileService.insertFile(surveyId, fileWithContent, this.tx) // NOSONAR
    }
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
    for (const level of plan.categoryLevelsToInsert) {
      await CategoryRepository.insertLevel({ surveyId, level, client: tx }) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.categoryLevelInsert, level))
    }
    for (const { categoryUuid, levelUuid, key, value } of plan.categoryLevelPropsToUpdate) {
      await CategoryRepository.updateLevelProp(surveyId, levelUuid, key, value, tx) // NOSONAR
      activities.push(
        ActivityLog.newActivity(ActivityLog.type.categoryLevelPropUpdate, { uuid: levelUuid, categoryUuid, key, value })
      )
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

  async applyTaxonomiesChanges(plan: SurveyCompareApplyPlan) {
    const { user, surveyId }: any = this.context
    const tx = this.tx
    const activities = []
    for (const { taxonomy, taxa } of plan.taxonomiesToInsert) {
      await TaxonomyRepository.insertTaxonomy({ surveyId, taxonomy }, tx) // NOSONAR
      await TaxonomyRepository.insertTaxa({ surveyId, taxa, client: tx }) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.taxonomyCreate, taxonomy))
    }
    for (const { taxonomyUuid, key, value } of plan.taxonomyPropsToUpdate) {
      await TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyUuid, key, value, tx) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.taxonomyPropUpdate, { uuid: taxonomyUuid, key, value }))
    }
    for (const { taxa } of plan.taxaToInsert) {
      await TaxonomyRepository.insertTaxa({ surveyId, taxa, client: tx }) // NOSONAR
    }
    for (const { taxa } of plan.taxaToUpdate) {
      await TaxonomyRepository.updateTaxa(surveyId, taxa, tx) // NOSONAR
    }
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
    // queries run one after the other in the transaction
    await DbUtils.runQueries(
      tx,
      plan.nodeDefsToUpdate.map(({ nodeDefUuid, parentUuid, type, props, propsAdvanced, meta }) => async () => {
        if (type) {
          await NodeDefRepository.updateNodeDefTypeAndProps({ surveyId, nodeDefUuid, type, props, propsAdvanced }, tx)
        }
        await NodeDefRepository.updateNodeDefProps(
          { surveyId, nodeDefUuid, parentUuid, props, propsAdvanced, meta: meta ?? {} },
          tx
        )
      })
    )
    activities.push(
      ...plan.nodeDefsToUpdate.map(({ nodeDefUuid, props, propsAdvanced }) =>
        ActivityLog.newActivity(ActivityLog.type.nodeDefUpdate, { uuid: nodeDefUuid, props, propsAdvanced })
      )
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  }

  // node defs first: categories and taxonomies can be deleted only when not used anymore
  async applyDeletions(plan: SurveyCompareApplyPlan) {
    const { user, surveyId }: any = this.context
    const tx = this.tx
    const activities = []
    for (const nodeDefUuid of plan.nodeDefUuidsToDelete) {
      await NodeDefRepository.markNodeDefDeleted(surveyId, nodeDefUuid, tx) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.nodeDefMarkDeleted, { uuid: nodeDefUuid }))
    }
    for (const { itemUuids } of plan.categoryItemsToDelete) {
      await CategoryRepository.deleteItems(surveyId, itemUuids, tx) // NOSONAR
    }
    for (const { categoryUuid, levelUuid } of plan.categoryLevelsToDelete) {
      await CategoryRepository.deleteLevel(surveyId, levelUuid, tx) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.categoryLevelDelete, { uuid: levelUuid, categoryUuid }))
    }
    for (const categoryUuid of plan.categoryUuidsToDelete) {
      await CategoryRepository.deleteCategory(surveyId, categoryUuid, tx) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.categoryDelete, { uuid: categoryUuid }))
    }
    if (plan.vernacularNameUuidsToDelete.length > 0) {
      await TaxonomyRepository.deleteDraftVernacularNamesByUuids(surveyId, plan.vernacularNameUuidsToDelete, tx)
    }
    if (plan.taxonUuidsToDelete.length > 0) {
      await TaxonomyRepository.deleteDraftTaxaByUuids(surveyId, plan.taxonUuidsToDelete, tx)
    }
    for (const taxonomyUuid of plan.taxonomyUuidsToDelete) {
      await TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyUuid, tx) // NOSONAR
      activities.push(ActivityLog.newActivity(ActivityLog.type.taxonomyDelete, { uuid: taxonomyUuid }))
    }
    await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  }

  generateResult(): Promise<any> {
    const { appliedIds = [], skippedIds = [] }: any = this.context
    return Promise.resolve({ appliedIds, skippedIds })
  }
}
