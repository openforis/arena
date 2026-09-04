import axios from 'axios'

import i18n from '@core/i18n/i18nFactory'
import * as Survey from '@core/survey/survey'

import { JobActions } from '@webapp/store/app'
import { DialogConfirmActions } from '@webapp/store/ui'

import * as SurveyState from '../state'
import { setActiveSurvey } from './active'

export const publishSurvey =
  ({ cleanupRecords = false, updateRecordValues = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const { data } = await axios.put(`/api/survey/${surveyId}/publish`, { cleanupRecords, updateRecordValues })

    const { recordValuesUpdateWarning } = data
    if (recordValuesUpdateWarning) {
      const surveyInfo = SurveyState.getSurveyInfo(state)
      const surveyLabel = Survey.getLabel(surveyInfo, SurveyState.getSurveyPreferredLang(state))

      const { attributeNames = [], categoryOrTaxonomyExtraPropAttributeNames = [] } = recordValuesUpdateWarning
      const reasons = []
      if (attributeNames.length > 0) {
        reasons.push(
          i18n.t('common.publishRecordValuesUpdateReasonAttributeChanged', {
            attributeNames: attributeNames.join(', '),
          })
        )
      }
      if (categoryOrTaxonomyExtraPropAttributeNames.length > 0) {
        reasons.push(
          i18n.t('common.publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged', {
            attributeNames: categoryOrTaxonomyExtraPropAttributeNames.join(', '),
          })
        )
      }

      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.publishRecordValuesUpdateConfirm',
          params: { survey: surveyLabel, reasons: reasons.join('\n\n') },
          headerText: 'common.publishRecordValuesUpdateConfirmHeader',
          strongConfirm: true,
          strongConfirmInputLabel: 'common.publishRecordValuesUpdateConfirmInputLabel',
          strongConfirmRequiredText: surveyLabel,
          onOk: publishSurvey({ cleanupRecords, updateRecordValues: true }),
        })
      )
      return
    }

    dispatch(
      JobActions.showJobMonitor({
        job: data.job,
        onComplete: async () => {
          await dispatch(setActiveSurvey(surveyId, true))
        },
      })
    )
  }
