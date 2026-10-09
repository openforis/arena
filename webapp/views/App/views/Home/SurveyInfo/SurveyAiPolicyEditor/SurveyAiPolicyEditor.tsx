import './SurveyAiPolicyEditor.scss'

import React, { useCallback, useEffect, useState } from 'react'

import { aiPolicyDataClasses, type AiPolicy, type AiPolicyLevel } from '@common/ai/policy'

import {
  fetchSurveyAiPolicy,
  updateSurveyAiPolicy,
  type SurveyAiPolicyClientState,
} from '@webapp/ai/policy/surveyAiPolicyClient'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import { FormItem } from '@webapp/components/form/Input'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { getLevelsAboveCeiling, getPolicyLevelOptions, getPolicySaveErrorMessage } from './policyLevelOptions'

type DataClass = keyof AiPolicy

type ClassEditorProps = {
  dataClass: DataClass
  state: SurveyAiPolicyClientState
  disabled: boolean
  onChange: (dataClass: DataClass, level: AiPolicyLevel | null) => void
}

/**
 * Segmented control of one data class, with the explanation of the chosen level and the ceiling note.
 * @param {ClassEditorProps} props - Props.
 * @returns {React.ReactElement} The control.
 */
const PolicyClassEditor = (props: ClassEditorProps) => {
  const { dataClass, state, disabled, onChange } = props
  const i18n = useI18n()
  const level = state.policy[dataClass]
  const ceiling = state.ceilings[dataClass]
  const lockedLevels = getLevelsAboveCeiling(ceiling)

  return (
    <FormItem label={`homeView:surveyInfo.aiPolicy.${dataClass}Label`}>
      <div className="survey-ai-policy__class">
        <span className="survey-ai-policy__hint">{i18n.t(`homeView:surveyInfo.aiPolicy.${dataClass}Hint`)}</span>
        <ButtonGroup
          groupName={TestId.surveyInfo.aiPolicy.levelGroup(dataClass)}
          items={getPolicyLevelOptions({ ceiling, readOnly: disabled })}
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
      const policy = { ...state.policy, [dataClass]: level }
      // show the choice at once; reverted below when the save fails
      setState({ ...state, policy })
      setSaving(true)
      try {
        setState(await updateSurveyAiPolicy(surveyId, policy))
        notifyInfo({ key: 'homeView:surveyInfo.aiPolicy.saved' })
      } catch (error) {
        setState(previous)
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
      {/* removed by C (local engines) */}
      <p className="survey-ai-policy__note">{i18n.t('homeView:surveyInfo.aiPolicy.onDeviceNote')}</p>
    </div>
  )
}
