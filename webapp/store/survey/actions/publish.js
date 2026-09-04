import axios from 'axios'

import i18n from '@core/i18n/i18nFactory'
import * as Survey from '@core/survey/survey'

import { JobActions } from '@webapp/store/app'
import { DialogConfirmActions } from '@webapp/store/ui'

import * as SurveyState from '../state'
import { setActiveSurvey } from './active'

export const publishSurvey =
  ({ cleanupRecords = false, updateRecordValues = false, skipDataUpdate = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const { data } = await axios.put(`/api/survey/${surveyId}/publish`, {
      cleanupRecords,
      updateRecordValues,
      skipDataUpdate,
    })

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
      const reasonsText = reasons.join('\n\n')

      // Skipping the data update is the risky choice (existing records can be left out of sync
      // with the published survey definition), so it's kept behind an unchecked-by-default checkbox
      // and only enforces the strong (type-the-survey-name) confirmation once checked; going ahead
      // with the (default) data update only needs a plain, informational confirm.
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.publishRecordValuesUpdateConfirm',
          params: { survey: surveyLabel, reasons: reasonsText },
          headerText: 'common.publishRecordValuesUpdateConfirmHeader',
          okButtonLabel: 'common.publishRecordValuesUpdateConfirmOk',
          onOk: publishSurvey({ cleanupRecords, updateRecordValues: true }),
          checkboxLabel: 'common.publishSkipDataUpdate',
          okButtonLabelChecked: 'common.publishSkipDataUpdateConfirmOk',
          okButtonClassChecked: 'btn-danger',
          onOkChecked: publishSurvey({ cleanupRecords, skipDataUpdate: true }),
          strongConfirm: true,
          strongConfirmInputLabel: 'common.publishRecordValuesUpdateConfirmInputLabel',
          strongConfirmRequiredText: surveyLabel,
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
