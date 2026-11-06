import React from 'react'

import { useI18n } from '@webapp/store/system'

type Props = {
  actions?: React.ReactNode
  children?: React.ReactNode
  label: string
}

/**
 * Titled section of the query sidebar.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The section element.
 */
export const QuerySidebarSection = (props: Props) => {
  const { actions, children, label } = props

  const i18n = useI18n()

  return (
    <section className="query-sidebar__section">
      <header className="query-sidebar__section-header">
        <h4>{i18n.t(label)}</h4>
        <span className="query-sidebar__section-actions">{actions}</span>
      </header>
      {children}
    </section>
  )
}
