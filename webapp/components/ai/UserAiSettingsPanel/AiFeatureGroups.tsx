import React from 'react'

import { AiFeatureCategory } from '@common/ai/features'

import { Fieldset } from '@webapp/components/Fieldset'
import { Checkbox } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { FeatureCategory, FeatureToggles } from './aiSettingsForm'
import {
  DATA_BADGE_KINDS,
  type DataBadgeKind,
  FEATURE_GROUPS,
  type FeatureGroup,
  getDataBadgeKind,
} from './featureGroups'

type ToggleChange = (category: FeatureCategory) => (checked: boolean) => void

/**
 * Data badge: a shape and the class name, never colour alone.
 * @param {object} props - Props.
 * @param {DataBadgeKind} props.kind - Data class, or none.
 * @returns {React.ReactElement} The badge.
 */
const Badge = ({ kind }: { kind: DataBadgeKind }) => {
  const i18n = useI18n()
  return (
    <span className={`user-ai-settings-panel__badge user-ai-settings-panel__badge--${kind}`}>
      <span className="user-ai-settings-panel__badge-shape" aria-hidden="true" />
      {i18n.t(`userAiSettings:dataClasses.${kind}`)}
    </span>
  )
}

/**
 * One switch with what it sends.
 * @param {object} props - Props.
 * @param {FeatureCategory} props.category - Category.
 * @param {boolean} props.checked - Switch state.
 * @param {Function} props.onChange - Called with the new state.
 * @returns {React.ReactElement} The row.
 */
const FeatureRow = ({
  category,
  checked,
  onChange,
}: {
  category: FeatureCategory
  checked: boolean
  onChange: (checked: boolean) => void
}) => {
  const i18n = useI18n()
  return (
    <div className="user-ai-settings-panel__feature">
      <Checkbox
        checked={checked}
        onChange={onChange}
        label={`userAiSettings:features.${category}.label`}
        testId={TestId.ai.featureToggle(category)}
      />
      <div className="user-ai-settings-panel__sends">
        <span className="user-ai-settings-panel__sends-label">{i18n.t('userAiSettings:features.sendsLabel')}</span>{' '}
        {i18n.t(`userAiSettings:features.${category}.sends`)}
      </div>
      {category === AiFeatureCategory.dataDictionary && (
        <div className="user-ai-settings-panel__sends">{i18n.t('userAiSettings:features.dataDictionary.runs')}</div>
      )}
    </div>
  )
}

/**
 * A group: its badge, the default survey policy hint and its switches.
 * @param {object} props - Props.
 * @param {FeatureGroup} props.group - Group.
 * @param {FeatureToggles} props.toggles - Switch states.
 * @param {ToggleChange} props.onToggleChange - Change handler factory.
 * @returns {React.ReactElement} The group.
 */
const FeatureGroupBlock = ({
  group,
  toggles,
  onToggleChange,
}: {
  group: FeatureGroup
  toggles: FeatureToggles
  onToggleChange: ToggleChange
}) => {
  const i18n = useI18n()
  return (
    <div className={`user-ai-settings-panel__group user-ai-settings-panel__group--${group.id}`}>
      <div className="user-ai-settings-panel__group-header">
        <Badge kind={getDataBadgeKind(group)} />
        <span className="user-ai-settings-panel__hint">
          {i18n.t(`userAiSettings:features.groupHints.${group.hintKey}`)}
        </span>
      </div>
      {group.categories.map((category) => (
        <FeatureRow
          key={category}
          category={category}
          checked={!!toggles[category]}
          onChange={onToggleChange(category)}
        />
      ))}
    </div>
  )
}

type Props = {
  toggles: FeatureToggles
  onToggleChange: ToggleChange
}

/**
 * "What AI can help with, and what it sees": the badge key, then the switches by data class.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fieldset.
 */
export const AiFeatureGroups = ({ toggles, onToggleChange }: Props) => {
  const i18n = useI18n()
  return (
    <Fieldset className="user-ai-settings-panel__section" legend="userAiSettings:features.section">
      <div className="user-ai-settings-panel__badge-key">
        {DATA_BADGE_KINDS.map((kind) => (
          <Badge key={kind} kind={kind} />
        ))}
        <span className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:features.keyHint')}</span>
      </div>
      {FEATURE_GROUPS.map((group) => (
        <FeatureGroupBlock key={group.id} group={group} toggles={toggles} onToggleChange={onToggleChange} />
      ))}
    </Fieldset>
  )
}
