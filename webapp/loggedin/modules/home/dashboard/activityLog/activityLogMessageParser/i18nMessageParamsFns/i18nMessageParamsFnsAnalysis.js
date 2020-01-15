import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

const _getProcessingChainLabel = lang => R.pipe(ActivityLog.getProcessingChainLabels, R.prop(lang))

export default {
  [ActivityLog.type.processingChainPropUpdate]: (survey, i18n) => activityLog => ({
    key: ActivityLog.getContentKey(activityLog),
    label: _getProcessingChainLabel(i18n.lang)(activityLog),
  }),

  [ActivityLog.type.processingChainDelete]: (survey, i18n) => activityLog => ({
    label: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.lang))(activityLog),
  }),

  [ActivityLog.type.processingStepCreate]: (survey, i18n) => activityLog => {
    const processingStep = ActivityLog.getContent(activityLog)
    return {
      index: ProcessingStep.getIndex(processingStep),
      processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
    }
  },

  [ActivityLog.type.processingStepPropUpdate]: (survey, i18n) => activityLog => {
    const content = ActivityLog.getContent(activityLog)

    // Only one of entityUuid or categoryUuid can have a value associated
    const entityUuid = content[ProcessingStep.keysProps.entityUuid]
    const categoryUuid = content[ProcessingStep.keysProps.categoryUuid]

    let key
    let value
    if (entityUuid) {
      key = i18n.t('nodeDefsTypes.entity')
      value = R.pipe(Survey.getNodeDefByUuid(entityUuid), entityDef => NodeDef.getLabel(entityDef, i18n.lang))(survey)
    } else {
      key = i18n.t('processingStepView.category')
      value = R.pipe(Survey.getCategoryByUuid(categoryUuid), Category.getName)(survey)
    }

    return {
      key,
      value,
      processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
      index: ActivityLog.getProcessingStepIndex(activityLog),
    }
  },

  [ActivityLog.type.processingStepDelete]: (survey, i18n) => activityLog => ({
    index: ActivityLog.getContentIndex(activityLog),
    processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
  }),

  [ActivityLog.type.processingStepCalculationCreate]: (survey, i18n) => activityLog => {
    const calculation = ActivityLog.getContent(activityLog)
    return {
      index: ProcessingStepCalculation.getIndex(calculation),
      processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
      stepIndex: ActivityLog.getProcessingStepIndex(activityLog),
    }
  },

  [ActivityLog.type.processingStepCalculationIndexUpdate]: (survey, i18n) => activityLog => ({
    indexFrom: ActivityLog.getContentIndexFrom(activityLog),
    indexTo: ActivityLog.getContentIndexTo(activityLog),
    processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
    stepIndex: ActivityLog.getProcessingStepIndex(activityLog),
  }),

  [ActivityLog.type.processingStepCalculationUpdate]: (survey, i18n) => activityLog => ({
    index: ActivityLog.getContentIndex(activityLog),
    label: R.pipe(ActivityLog.getContent, ProcessingStepCalculation.getLabel(i18n.lang))(activityLog),
    processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
    stepIndex: ActivityLog.getProcessingStepIndex(activityLog),
  }),

  [ActivityLog.type.processingStepCalculationDelete]: (survey, i18n) => activityLog => ({
    index: ActivityLog.getContentIndex(activityLog),
    label: R.pipe(ActivityLog.getContentLabels, R.prop(i18n.lang))(activityLog),
    processingChainLabel: _getProcessingChainLabel(i18n.lang)(activityLog),
    stepIndex: ActivityLog.getProcessingStepIndex(activityLog),
  }),
}
