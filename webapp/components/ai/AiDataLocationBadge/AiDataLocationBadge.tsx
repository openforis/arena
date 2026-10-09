import './AiDataLocationBadge.scss'

import React from 'react'
import classNames from 'classnames'

import type { AiDataClass } from '@common/ai/features'
import type { AiHostingClass } from '@common/ai/policy'

import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

const iconByHostingClass: Record<AiHostingClass, string> = {
  cloud: 'icon-cloud',
  orgHosted: 'icon-office',
  onDevice: 'icon-laptop',
}

type Props = {
  hostingClass: AiHostingClass | null
  provider?: string | null
  model?: string | null
  engine?: string | null
  // icon only, the text in the tooltip (next to small buttons)
  compact?: boolean
  className?: string
}

/**
 * Shows where an AI feature's data is processed (cloud provider, organisation server, this device).
 * @param {Props} props - Props.
 * @returns {React.ReactElement|null} The badge, or null when no provider is configured.
 */
export const AiDataLocationBadge = (props: Props) => {
  const { hostingClass, provider = null, model = null, engine = null, compact = false, className } = props
  const i18n = useI18n()
  const t = (key: string, params?: object): string => i18n.t(key, (params ?? {}) as Record<string, unknown>)

  const text = getAiDataLocationText({ location: { hostingClass, provider, model, engine }, t })
  if (!hostingClass || !text) return null

  const title = model ? t('aiDataLocation.modelTitle', { location: text, model }) : text

  return (
    <span
      className={classNames(
        'ai-data-location-badge',
        `ai-data-location-badge--${hostingClass}`,
        { 'ai-data-location-badge--compact': compact },
        className
      )}
      role="note"
      aria-label={t('aiDataLocation.ariaLabel', { location: text })}
      title={title}
      data-testid={TestId.ai.dataLocationBadge}
    >
      <span className={`icon ${iconByHostingClass[hostingClass]} icon-12px`} aria-hidden="true" />
      {!compact && <span className="ai-data-location-badge__text">{text}</span>}
    </span>
  )
}

/**
 * Data-location badge of a feature (location from useAiFeatureAvailability).
 * @param {object} props - Props.
 * @param {AiDataClass} [props.dataClass] - Data class of the request (the assistant passes its conversation's).
 * @param {string} props.feature - Feature key.
 * @param {boolean} [props.compact] - Icon only.
 * @returns {React.ReactElement|null} The badge.
 */
export const AiFeatureDataLocationBadge = ({
  feature,
  dataClass,
  compact = false,
}: {
  feature: string
  dataClass?: AiDataClass
  compact?: boolean
}) => {
  const { location } = useAiFeatureAvailability(feature, { dataClass })
  return <AiDataLocationBadge {...location} compact={compact} />
}
