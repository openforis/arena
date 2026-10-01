import React from 'react'

import { useI18n } from '@webapp/store/system'

type DashboardSectionProps = {
  titleKey?: string
  testId?: string
  children: React.ReactNode
}

/**
 * Titled container grouping related dashboard content.
 *
 * @param {DashboardSectionProps} props - The component props.
 * @returns {React.ReactElement} The section.
 */
export const DashboardSection = (props: DashboardSectionProps) => {
  const { titleKey, testId, children } = props
  const i18n = useI18n()

  return (
    <section className="home-dashboard__section" data-testid={testId}>
      {titleKey && <h3 className="home-dashboard__section-title">{i18n.t(titleKey) as string}</h3>}
      {children}
    </section>
  )
}
