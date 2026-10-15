import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { copyToClipboard } from '@webapp/utils/domUtils'
import { TestId } from '@webapp/utils/testId'

export interface SurveyFingerprint {
  strict: string
  structural: string
}

const fingerprintTypes = ['strict', 'structural'] as const

type FingerprintType = (typeof fingerprintTypes)[number]

const shortLength = 12

// fingerprint of the current survey before any comparison is done
const useCurrentSurveyFingerprint = ({ surveyId, skip }: { surveyId: number; skip: boolean }) => {
  const [fingerprint, setFingerprint] = useState<SurveyFingerprint | null>(null)
  useEffect(() => {
    if (skip) return undefined
    let active = true
    API.fetchSurveyFingerprint({ surveyId })
      .then((fingerprintFetched) => {
        if (active) setFingerprint(fingerprintFetched)
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [skip, surveyId])
  return fingerprint
}

const FingerprintRow = ({
  label,
  fingerprint,
  reference = null,
  getTestId,
}: {
  label: string
  fingerprint: SurveyFingerprint
  reference?: SurveyFingerprint | null
  getTestId: (type: FingerprintType) => string
}) => {
  const dispatch = useDispatch()
  const i18n = useI18n()

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

  return (
    <div className="survey-compare__fingerprint-row">
      <span className="survey-compare__fingerprint-label">{i18n.t(label)}:</span>
      {fingerprintTypes.map((type) => {
        const value = fingerprint[type]
        const equal = reference ? reference[type] === value : null
        return (
          <span key={type} className="survey-compare__fingerprint-item">
            {type === 'structural' && <span>{i18n.t('surveyCompareView:fingerprint.structural')}:</span>}
            <button
              className="survey-compare__fingerprint-value"
              data-testid={getTestId(type)}
              onClick={() => onCopy(value)}
              title={i18n.t('surveyCompareView:fingerprint.copy', { value })}
              type="button"
            >
              {value.substring(0, shortLength)}
            </button>
            {equal !== null && (
              <span
                className={`icon icon-12px ${equal ? 'icon-checkmark survey-compare__fingerprint--equal' : 'icon-cross survey-compare__fingerprint--different'}`}
                title={i18n.t(`surveyCompareView:fingerprint.${equal ? 'equal' : 'different'}`)}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Fingerprints of the survey definitions: of this survey and, once compared, of the compared survey.
 * Identical fingerprints mean identical definitions; values are copied on click.
 * @param {object} props - The props.
 * @param {number} props.surveyId - Id of the current survey.
 * @param {SurveyFingerprint} [props.targetFingerprint] - Fingerprint of this survey computed by the comparison.
 * @param {SurveyFingerprint} [props.sourceFingerprint] - Fingerprint of the compared survey.
 * @returns {React.ReactElement | null} - The component.
 */
export const SurveyCompareFingerprints = ({
  surveyId,
  targetFingerprint = null,
  sourceFingerprint = null,
}: {
  surveyId: number
  targetFingerprint?: SurveyFingerprint | null
  sourceFingerprint?: SurveyFingerprint | null
}) => {
  const i18n = useI18n()
  const currentFingerprint = useCurrentSurveyFingerprint({ surveyId, skip: Boolean(targetFingerprint) })
  const fingerprint = targetFingerprint ?? currentFingerprint
  if (!fingerprint) return null

  return (
    <div className="survey-compare__fingerprints">
      <span className="icon icon-key icon-12px" />
      <span>{i18n.t('surveyCompareView:fingerprint.label')}</span>
      <div className="survey-compare__fingerprint-grid">
        <FingerprintRow
          label="surveyCompareView:fingerprint.thisSurvey"
          fingerprint={fingerprint}
          getTestId={TestId.surveyCompare.fingerprint}
        />
        {sourceFingerprint && (
          <FingerprintRow
            label="surveyCompareView:fingerprint.comparedSurvey"
            fingerprint={sourceFingerprint}
            reference={fingerprint}
            getTestId={TestId.surveyCompare.sourceFingerprint}
          />
        )}
      </div>
      <span className="survey-compare__fingerprint-info" title={i18n.t('surveyCompareView:fingerprint.info')}>
        {i18n.t('surveyCompareView:fingerprint.whatIsIt')}
      </span>
    </div>
  )
}
