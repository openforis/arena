import React, { useId, useRef, useState } from 'react'
import { Tooltip } from '@mui/material'

import {
  AI_ACCESS_LEVELS,
  type AiAccessLevel as AccessLevel,
  isCategoryWithinAccessLevel,
} from '@common/ai/accessLevel'

import { Fieldset } from '@webapp/components/Fieldset'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { countAccessLevelFeatures, type FeatureCategory, type FeatureToggles } from './aiSettingsForm'
import { DataBadge } from './DataBadge'
import { FEATURE_GROUPS, getDataBadgeKind } from './featureGroups'

// level → i18n key of its step; index = level
const LEVEL_KEYS = ['off', 'help', 'design', 'data'] as const
// rank → i18n key of the class it adds
const CLASS_KEYS = [
  { rank: 1, key: 'help' },
  { rank: 2, key: 'design' },
  { rank: 3, key: 'data' },
] as const

type Props = {
  accessLevel: AccessLevel
  toggles: FeatureToggles
  onLevelChange: (level: AccessLevel) => void
  onToggleChange: (category: FeatureCategory) => (checked: boolean) => void
}

/**
 * The 4 steps as a radio group (arrow keys move the selection, as in a native radio group).
 * @param {object} props - Props.
 * @param {AccessLevel} props.accessLevel - Selected level.
 * @param {Function} props.onLevelChange - Called with the new level.
 * @returns {React.ReactElement} The segmented control.
 */
const LevelSteps = ({
  accessLevel,
  onLevelChange,
}: {
  accessLevel: AccessLevel
  onLevelChange: (level: AccessLevel) => void
}) => {
  const i18n = useI18n()
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = Math.min(3, Math.max(0, accessLevel + step)) as AccessLevel
    onLevelChange(next)
    buttonsRef.current[next]?.focus()
  }
  return (
    <div
      className="user-ai-settings-panel__levels"
      role="radiogroup"
      aria-label={i18n.t('userAiSettings:access.section')}
      onKeyDown={onKeyDown}
    >
      {AI_ACCESS_LEVELS.map((level) => (
        <button
          key={level}
          ref={(element) => {
            buttonsRef.current[level] = element
          }}
          type="button"
          role="radio"
          aria-checked={level === accessLevel}
          // roving tab stop: Tab enters on the selected step
          tabIndex={level === accessLevel ? 0 : -1}
          className={`user-ai-settings-panel__level${level === accessLevel ? ' user-ai-settings-panel__level--on' : ''}`}
          onClick={() => onLevelChange(level)}
          data-testid={TestId.ai.accessLevel(level)}
        >
          {i18n.t(`userAiSettings:access.levels.${LEVEL_KEYS[level]}`)}
          <span className="user-ai-settings-panel__level-bar" aria-hidden="true">
            {CLASS_KEYS.map(({ rank }) => (
              <i key={rank} className={rank <= level ? 'is-filled' : undefined} />
            ))}
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * What each class covers; the classes within the level are highlighted.
 * @param {object} props - Props.
 * @param {AccessLevel} props.accessLevel - Selected level.
 * @returns {React.ReactElement} The three cells.
 */
const ClassCells = ({ accessLevel }: { accessLevel: AccessLevel }) => {
  const i18n = useI18n()
  return (
    <div className="user-ai-settings-panel__classes">
      {CLASS_KEYS.map(({ rank, key }) => (
        <div
          key={key}
          className={`user-ai-settings-panel__class${rank <= accessLevel ? ' user-ai-settings-panel__class--in' : ''}`}
        >
          <span className="user-ai-settings-panel__class-title">
            {i18n.t(`userAiSettings:access.classes.${key}.title`)}
          </span>
          <span>{i18n.t(`userAiSettings:access.classes.${key}.text`)}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * A feature chip: a toggle button and an ⓘ that shows what the feature sends (on hover and on focus).
 * @param {object} props - Props.
 * @param {FeatureCategory} props.category - Category.
 * @param {boolean} props.checked - Toggle state.
 * @param {boolean} props.disabled - True when the level does not cover the category.
 * @param {Function} props.onChange - Called with the new state.
 * @returns {React.ReactElement} The chip.
 */
const FeatureChip = ({
  category,
  checked,
  disabled,
  onChange,
}: {
  category: FeatureCategory
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) => {
  const i18n = useI18n()
  const sends = i18n.t(`userAiSettings:features.${category}.sends`)
  return (
    <span className={`user-ai-settings-panel__chip${checked ? ' user-ai-settings-panel__chip--on' : ''}`}>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        data-testid={TestId.ai.featureToggle(category)}
      >
        {i18n.t(`userAiSettings:features.${category}.label`)}
      </button>
      <Tooltip title={sends} describeChild>
        <span
          className="user-ai-settings-panel__chip-info"
          tabIndex={0}
          role="img"
          aria-label={`${i18n.t('userAiSettings:access.sendsInfo')}: ${sends}`}
        >
          i
        </span>
      </Tooltip>
    </span>
  )
}

/**
 * The chips by data class, under "Customize".
 * @param {object} props - Props.
 * @param {string} props.id - Element id (for aria-controls).
 * @param {AccessLevel} props.accessLevel - Level.
 * @param {FeatureToggles} props.toggles - Toggles.
 * @param {Function} props.onToggleChange - Change handler factory.
 * @returns {React.ReactElement} The chip groups.
 */
const FeatureChips = ({
  id,
  accessLevel,
  toggles,
  onToggleChange,
}: {
  id: string
  accessLevel: AccessLevel
  toggles: FeatureToggles
  onToggleChange: Props['onToggleChange']
}) => {
  const i18n = useI18n()
  return (
    <div id={id} className="user-ai-settings-panel__chips">
      {FEATURE_GROUPS.map((group) => (
        <div
          key={group.id}
          role="group"
          className="user-ai-settings-panel__chip-group"
          aria-labelledby={`${id}-${group.id}`}
        >
          <DataBadge kind={getDataBadgeKind(group)} id={`${id}-${group.id}`} />
          <span className="user-ai-settings-panel__chip-row">
            {group.categories.map((category) => (
              <FeatureChip
                key={category}
                category={category}
                checked={!!toggles[category]}
                disabled={!isCategoryWithinAccessLevel(category, accessLevel)}
                onChange={onToggleChange(category)}
              />
            ))}
          </span>
        </div>
      ))}
      <span className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:access.customizeHint')}</span>
    </div>
  )
}

/**
 * "What AI can see": the level, what it covers and, under Customize, the single features.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fieldset.
 */
export const AiAccessLevel = ({ accessLevel, toggles, onLevelChange, onToggleChange }: Props) => {
  const i18n = useI18n()
  const chipsId = useId()
  const [open, setOpen] = useState(false)
  const { on, total } = countAccessLevelFeatures({ accessLevel, featureToggles: toggles })
  return (
    <Fieldset className="user-ai-settings-panel__section" legend="userAiSettings:access.section">
      <LevelSteps accessLevel={accessLevel} onLevelChange={onLevelChange} />
      <ClassCells accessLevel={accessLevel} />
      {accessLevel === 0 ? (
        <span className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:access.off')}</span>
      ) : (
        <>
          <button
            type="button"
            className="user-ai-settings-panel__link user-ai-settings-panel__customize"
            aria-expanded={open}
            aria-controls={chipsId}
            onClick={() => setOpen((prev) => !prev)}
            data-testid={TestId.ai.accessCustomize}
          >
            <span aria-hidden="true">{open ? '▾' : '▸'}</span> {i18n.t('userAiSettings:access.count', { on, total })} ·{' '}
            {i18n.t('userAiSettings:access.customize')}
          </button>
          {open && (
            <FeatureChips id={chipsId} accessLevel={accessLevel} toggles={toggles} onToggleChange={onToggleChange} />
          )}
        </>
      )}
    </Fieldset>
  )
}
