import React from 'react'

import { ProviderMonogram } from '@webapp/components/ai/ProviderMonogram/ProviderMonogram'
import { TestId } from '@webapp/utils/testId'

import { useT } from '../useT'
import type { ProviderDialogType, ProviderTypeGroup } from './providerTypes'

// the small line under a type name; the cloud types without one are well known
const HINT_KEYS: Partial<Record<ProviderDialogType, string>> = {
  local: 'userAiSettings:localServer.where',
  orgServer: 'userAiSettings:typeHints.orgServer',
  'openai-compatible': 'userAiSettings:typeHints.openai-compatible',
  'vercel-ai-sdk': 'userAiSettings:typeHints.vercel-ai-sdk',
}

const GROUP_LABELS: Record<ProviderTypeGroup['key'], string> = {
  local: 'userAiSettings:dialog.groupLocal',
  cloud: 'userAiSettings:dialog.groupCloud',
}

type Props = {
  groups: ProviderTypeGroup[]
  onChoose: (type: ProviderDialogType) => void
}

/**
 * Step 1 of "Add provider": the provider types in two groups; a click opens step 2.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The step.
 */
export const ProviderTypeStep = ({ groups, onChoose }: Props) => {
  const t = useT()
  return (
    <div className="provider-dialog__types">
      {groups.map((group) => (
        <div
          key={group.key}
          className="provider-dialog__type-group"
          role="group"
          aria-label={t(GROUP_LABELS[group.key])}
        >
          <span className="provider-dialog__group-label">{t(GROUP_LABELS[group.key])}</span>
          <div className="provider-dialog__type-grid">
            {group.options.map(({ spec, disabled }) => {
              const hintKey = HINT_KEYS[spec.value]
              return (
                <button
                  key={spec.value}
                  type="button"
                  className="provider-dialog__type"
                  disabled={disabled}
                  onClick={() => onChoose(spec.value)}
                  data-testid={TestId.ai.providerType(spec.value)}
                >
                  <ProviderMonogram type={spec.value} />
                  <span className="provider-dialog__type-text">
                    <span className="provider-dialog__type-name">{t(`userAiSettings:types.${spec.value}`)}</span>
                    {hintKey && <small>{t(hintKey)}</small>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
