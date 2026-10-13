import React from 'react'

import { useI18n } from '@webapp/store/system'

import type { DataBadgeKind } from './featureGroups'

/**
 * Data badge: a shape and the class name, never colour alone.
 * @param {object} props - Props.
 * @param {DataBadgeKind} props.kind - Data class, or none.
 * @param {string} [props.id] - Element id, to label a group.
 * @returns {React.ReactElement} The badge.
 */
export const DataBadge = ({ kind, id = undefined }: { kind: DataBadgeKind; id?: string }) => {
  const i18n = useI18n()
  return (
    <span id={id} className={`user-ai-settings-panel__badge user-ai-settings-panel__badge--${kind}`}>
      <span className="user-ai-settings-panel__badge-shape" aria-hidden="true" />
      {i18n.t(`userAiSettings:dataClasses.${kind}`)}
    </span>
  )
}
