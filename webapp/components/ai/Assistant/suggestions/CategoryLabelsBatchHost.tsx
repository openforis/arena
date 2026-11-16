/**
 * Runs Do it of the "category labels missing in <language>" suggestion: the progress dialog of the browser batch,
 * then the translation review; nothing is written before Apply. Always mounted next to the suggestions host.
 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useDispatch, useStore } from 'react-redux'

import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { uuidv4 } from '@core/uuid'

import { createCategoryLabelsApplierDeps } from '@webapp/ai/changeSets/categoryItemLabels/categoryLabelsApplierDeps'
import { onCategoryLabelsBatchRequest } from '@webapp/ai/suggestions/categoryLabelsBatchRequest'
import { getSuggestionScopeKey } from '@webapp/ai/suggestions/detectors/designTargets'
import { suggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import type { CategoryLabelsTranslationResult } from '@webapp/ai/workflows/translateCategoryItemLabels'
import { AiBatchProgressDialog, useAiBatchRun } from '@webapp/components/ai/AiBatchProgressDialog'
import { useNotifyInfo, useNotifyWarning } from '@webapp/components/hooks'
import * as SurveyState from '@webapp/store/survey/state'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

// loaded on the first Do it: the batch pulls in the AI runtime, the review is a designer screen
const loadWorkflow = () => import('@webapp/ai/workflows/translateCategoryItemLabels')
const NodeDefsTranslationModal = lazy(async () => ({
  default: (await import('@webapp/components/survey/SurveyForm/FormHeader/NodeDefsTranslationModal'))
    .NodeDefsTranslationModal,
}))

type ReviewItems = ReturnType<Awaited<ReturnType<typeof loadWorkflow>>['toCategoryLabelReviewItems']>

type Review = { result: CategoryLabelsTranslationResult; items: ReviewItems; surveyId: number; release: () => void }

type AppliedItem = { nodeDefUuid: string; props: { labels: Record<string, string> } }

/**
 * The batch host of the category labels suggestion.
 * @returns {React.ReactElement} The progress dialog or the review, when a run is on.
 */
export const CategoryLabelsBatchHost = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const store = useStore()
  const user = useUser()
  const userUuid: string | null = user ? User.getUuid(user) : null
  const notifyInfo = useNotifyInfo()
  const notifyWarning = useNotifyWarning()
  const { run, start, close } = useAiBatchRun()
  const [review, setReview] = useState<Review | null>(null)

  const getSurvey = useCallback(() => SurveyState.getSurvey(store.getState()), [store])

  /**
   * Translates the missing labels of the suggestion's categories, then opens the review.
   * @param {AssistantSuggestion} suggestion - Visible suggestion.
   * @returns {Promise<void>} Resolves when the run ends.
   */
  const onRequest = useCallback(
    async (suggestion: AssistantSuggestion): Promise<void> => {
      const survey = getSurvey()
      const surveyId = Number(Survey.getId(survey))
      if (!userUuid || suggestion.surveyId !== surveyId) return
      const lang = getSuggestionScopeKey(suggestion.id)
      const categories = suggestion.targets.flatMap(({ key }) => {
        const category = Survey.getCategoryByUuid(key)(survey)
        return category ? [{ uuid: key, name: Category.getName(category) }] : []
      })
      // in progress like a Do it sent to the chat; the run has no conversation, so a reload shows the card again
      const progressId = `categoryLabelsBatch:${uuidv4()}`
      const targetKeys = categories.map(({ uuid }) => uuid)
      suggestionStore.startProgress({ userUuid, surveyId, id: suggestion.id, conversationId: progressId, targetKeys })
      // 'failed' only ends the progress: the counts the detector fetches after Apply say what is left
      const release = () =>
        suggestionStore.onConversationSettled({ userUuid, conversationId: progressId, outcome: 'failed' })
      let reviewing = false
      const workflow = await loadWorkflow().catch(() => null)
      if (!workflow) {
        release()
        return
      }
      await start<CategoryLabelsTranslationResult>({
        titleKey: 'aiBatch.categoryLabelsTitle',
        run: ({ signal, onProgress }) =>
          workflow.translateCategoryItemLabelsWorkflow({
            surveyId,
            categories,
            lang,
            languages: Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[],
            signal,
            onProgress,
          }),
        onDone: (result) => {
          if (result.rows.length === 0) {
            const { failedCount: count } = result
            if (count > 0) notifyWarning({ key: 'surveyForm:nodeDefsTranslation.failed', params: { count } })
            // a stop already has its notice
            else if (!result.stop) notifyWarning({ key: 'aiBatch.categoryLabelsNothing' })
            return
          }
          reviewing = true
          setReview({ result, items: workflow.toCategoryLabelReviewItems(result), surveyId, release })
        },
      })
      // failed, stopped with nothing or abandoned: the card shows again
      if (!reviewing) release()
    },
    [getSurvey, notifyWarning, start, userUuid]
  )

  useEffect(() => onCategoryLabelsBatchRequest((suggestion) => void onRequest(suggestion)), [onRequest])

  const closeReview = useCallback(() => {
    review?.release()
    setReview(null)
  }, [review])

  /**
   * Writes the reviewed labels through the Apply path of the category label cards.
   * @param {AppliedItem[]} items - Reviewed rows.
   * @returns {Promise<void>} Resolves when every request ended.
   */
  const onApplyLabels = useCallback(
    async (items: AppliedItem[]): Promise<void> => {
      if (!review) return
      const { lang, rows } = review.result
      const textByItemUuid = Object.fromEntries(items.map((item) => [item.nodeDefUuid, item.props.labels[lang]]))
      const workflow = await loadWorkflow()
      const { operations, tooLongCount } = workflow.buildCategoryLabelOperations({ rows, lang, textByItemUuid })
      const { appliedCount, notAppliedCount } = await workflow.applyCategoryLabelOperations({
        surveyId: review.surveyId,
        operations,
        getSurvey,
        deps: createCategoryLabelsApplierDeps({ dispatch, getSurvey }),
      })
      // one notification: a second one would replace the first
      const count = notAppliedCount + tooLongCount
      if (count > 0) notifyWarning({ key: 'aiBatch.categoryLabelsNotSaved', params: { count, saved: appliedCount } })
      else notifyInfo({ key: 'aiBatch.categoryLabelsSaved', params: { count: appliedCount } })
    },
    [dispatch, getSurvey, notifyInfo, notifyWarning, review]
  )

  if (run) return <AiBatchProgressDialog run={run} onClose={close} />
  if (!review) return null
  const { result } = review
  const sourceLangs = [...new Set(result.rows.map((row) => row.source.lang))].join(', ')
  return (
    <Suspense fallback={null}>
      <NodeDefsTranslationModal
        labelsOnly
        onApplyLabels={onApplyLabels}
        onClose={closeReview}
        pathHeader={`${i18n.t('appModules.category')} / ${i18n.t('common.code')}`}
        result={{
          defaultLang: sourceLangs,
          languages: [result.lang],
          otherLangs: [result.lang],
          items: review.items,
          failedCount: result.failedCount,
          notDoneCount: result.notDoneCount,
        }}
        title="aiBatch.categoryLabelsTitle"
      />
    </Suspense>
  )
}
