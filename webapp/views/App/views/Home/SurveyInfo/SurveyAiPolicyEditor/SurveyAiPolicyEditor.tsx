import './SurveyAiPolicyEditor.scss'

import React, { useCallback, useEffect, useState } from 'react'

import { aiPolicyDataClasses, type AiPolicy, type AiPolicyLevel } from '@common/ai/policy'

import {
  fetchSurveyAiPolicy,
  invalidateSurveyAiPolicy,
  updateSurveyAiPolicy,
  type SurveyAiPolicyClientState,
} from '@webapp/ai/policy/surveyAiPolicyClient'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import { FormItem } from '@webapp/components/form/Input'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import {
  applyPolicyChoice,
  getLevelsAbove,
  getPolicyLevelOptions,
  getPolicySaveErrorMessage,
} from './policyLevelOptions'

type DataClass = keyof AiPolicy

type ClassEditorProps = {
  dataClass: DataClass
  state: SurveyAiPolicyClientState
  disabled: boolean
  onChange: (dataClass: DataClass, level: AiPolicyLevel | null) => void
}

/**
 * Segmented control of one data class, with the explanation of the chosen level and the notes on the levels that
 * cannot be chosen (instance ceiling; for record data, also the survey design level).
 * @param {ClassEditorProps} props - Props.
 * @returns {React.ReactElement} The control.
 */
const PolicyClassEditor = (props: ClassEditorProps) => {
  const { dataClass, state, disabled, onChange } = props
  const i18n = useI18n()
  const level = state.policy[dataClass]
  const ceiling = state.ceilings[dataClass]
  const lockedLevels = getLevelsAbove(ceiling)
  // record data cannot be more permissive than the survey design
  const limit = dataClass === 'data' ? state.policy.schema : undefined
  const limitedLevels = limit ? getLevelsAbove(limit).filter((locked) => !lockedLevels.includes(locked)) : []

  return (
    <FormItem label={`homeView:surveyInfo.aiPolicy.${dataClass}Label`}>
      <div className="survey-ai-policy__class">
        <span className="survey-ai-policy__hint">{i18n.t(`homeView:surveyInfo.aiPolicy.${dataClass}Hint`)}</span>
        <ButtonGroup
          groupName={TestId.surveyInfo.aiPolicy.levelGroup(dataClass)}
          items={getPolicyLevelOptions({ ceiling, readOnly: disabled, limit })}
          selectedItemKey={level}
          // ButtonGroup (JS) types its onChange as a no-argument function
          onChange={((levelNext: AiPolicyLevel | null) => onChange(dataClass, levelNext)) as () => void}
        />
        <span className="survey-ai-policy__level-hint">
          {i18n.t(`homeView:surveyInfo.aiPolicy.levelHint.${level}`)}
        </span>
        {lockedLevels.length > 0 && (
          <span
            className="survey-ai-policy__ceiling-note"
            data-testid={TestId.surveyInfo.aiPolicy.ceilingNote(dataClass)}
          >
            {i18n.t('homeView:surveyInfo.aiPolicy.notAllowedOnInstance', {
              levels: lockedLevels.map((locked) => i18n.t(`aiPolicy.level.${locked}`)).join(', '),
            })}
          </span>
        )}
        {limitedLevels.length > 0 && (
          <span className="survey-ai-policy__ceiling-note">
            {i18n.t('homeView:surveyInfo.aiPolicy.dataLimitedBySchema', {
              levels: limitedLevels.map((locked) => i18n.t(`aiPolicy.level.${locked}`)).join(', '),
            })}
          </span>
        )}
      </div>
    </FormItem>
  )
}

/**
 * "AI policy" tab of the survey info: where AI may process the survey design and the record data.
 * Saved on change; read only for users who are not survey administrators.
 * @returns {React.ReactElement} The tab content.
 */
export const SurveyAiPolicyEditor = () => {
  const surveyId = useSurveyId()
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [state, setState] = useState<SurveyAiPolicyClientState | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchSurveyAiPolicy(surveyId)
      .then((value) => {
        if (active) setState(value)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [surveyId])

  const onChange = useCallback(
    async (dataClass: DataClass, level: AiPolicyLevel | null) => {
      if (!state || !level || level === state.policy[dataClass]) return
      const previous = state
      // lowering the design below the record data lowers the data with it (the server refuses data above design)
      const { policy, dataLowered } = applyPolicyChoice({ policy: state.policy, dataClass, level })
      // show the choice at once; reverted below when the save fails
      setState({ ...state, policy })
      setSaving(true)
      try {
        setState(await updateSurveyAiPolicy(surveyId, policy))
        notifyInfo({
          key: dataLowered ? 'homeView:surveyInfo.aiPolicy.savedDataLowered' : 'homeView:surveyInfo.aiPolicy.saved',
        })
      } catch (error) {
        // show what the server holds now (the failure may come from a changed role or ceiling), else the previous value
        setState(await invalidateSurveyAiPolicy(surveyId).catch(() => previous))
        const message = getPolicySaveErrorMessage({
          error,
          t: (key, params) => i18n.t(key, params as Record<string, unknown>),
        })
        notifyError({ key: 'homeView:surveyInfo.aiPolicy.saveError', params: { message } })
      } finally {
        setSaving(false)
      }
    },
    [i18n, notifyError, notifyInfo, state, surveyId]
  )

  if (loadError) {
    return (
      <div className="survey-ai-policy">
        <p role="alert">{i18n.t('homeView:surveyInfo.aiPolicy.loadError')}</p>
      </div>
    )
  }
  if (!state) return null

  const readOnly = !state.canEdit

  return (
    <div className="survey-ai-policy" data-testid={TestId.surveyInfo.aiPolicy.container}>
      <p className="survey-ai-policy__intro">{i18n.t('homeView:surveyInfo.aiPolicy.intro')}</p>
      {readOnly && (
        <p className="survey-ai-policy__read-only" data-testid={TestId.surveyInfo.aiPolicy.readOnlyNote}>
          {i18n.t('homeView:surveyInfo.aiPolicy.readOnly')}
        </p>
      )}
      {aiPolicyDataClasses.map((dataClass) => (
        <PolicyClassEditor
          key={dataClass}
          dataClass={dataClass}
          state={state}
          disabled={readOnly || saving}
          onChange={onChange}
        />
      ))}
      <p className="survey-ai-policy__note">{i18n.t('homeView:surveyInfo.aiPolicy.onDeviceNote')}</p>
    </div>
  )
}
