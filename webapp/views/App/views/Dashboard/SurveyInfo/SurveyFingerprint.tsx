import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { copyToClipboard } from '@webapp/utils/domUtils'
import { TestId } from '@webapp/utils/testId'

const shortLength = 12

/**
 * Fingerprints of the survey definition (draft): identical fingerprints mean identical definitions.
 * The short form is shown, the full one is copied on click.
 * @returns {React.ReactElement | null} - The component.
 */
export const SurveyFingerprint = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const dateModified = Survey.getDateModified(surveyInfo)
  const [fingerprint, setFingerprint] = useState<{ strict: string; structural: string } | null>(null)

  useEffect(() => {
    let active = true
    API.fetchSurveyFingerprint({ surveyId })
      .then((fingerprintFetched) => {
        if (active) setFingerprint(fingerprintFetched)
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [surveyId, dateModified])

  const onCopy = useCallback(
    async (value: string) => {
      if (await copyToClipboard(value)) {
        dispatch(
          NotificationActions.notifyInfo({
            key: 'surveyCompareView:fingerprint.copied',
            params: undefined,
            text: undefined,
          }) as any
        )
      }
    },
    [dispatch]
  )

  if (!fingerprint) return null

  const renderValue = (type: 'strict' | 'structural') => (
    <button
      className="survey-fingerprint__value"
      data-testid={type === 'strict' ? TestId.dashboard.surveyFingerprint : undefined}
      onClick={() => onCopy(fingerprint[type])}
      title={i18n.t('surveyCompareView:fingerprint.copy', { value: fingerprint[type] })}
      type="button"
    >
      {fingerprint[type].substring(0, shortLength)}
    </button>
  )

  return (
    <div className="survey-fingerprint" title={i18n.t('surveyCompareView:fingerprint.info')}>
      <span className="icon icon-key icon-12px" />
      <span>{i18n.t('surveyCompareView:fingerprint.label')}:</span>
      {renderValue('strict')}
      <span>{i18n.t('surveyCompareView:fingerprint.structural')}:</span>
      {renderValue('structural')}
    </div>
  )
}
