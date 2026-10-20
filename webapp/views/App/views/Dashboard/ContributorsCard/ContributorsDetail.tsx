import './ContributorsCard.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'

import { filterActiveContributors, UserCountRow } from '../utils/filterActiveContributors'

type ContributorsDetailProps = { userCounts: UserCountRow[] }

const getContributorLabel = (row: UserCountRow): string => row.owner_email || row.owner_name || row.owner_uuid || ''

/**
 * Lists the contributors (email, or name as fallback) with their record count and the active ones.
 *
 * @param {ContributorsDetailProps} props - The component props.
 * @returns {React.ReactElement} The detail.
 */
export const ContributorsDetail = (props: ContributorsDetailProps) => {
  const { userCounts } = props
  const i18n = useI18n()
  const activeContributors = filterActiveContributors(userCounts)

  return (
    <div className="dashboard-contributors-card">
      <ul className="dashboard-contributors-card__list">
        {userCounts.map((row, index) => (
          <li key={row.owner_uuid ?? index} className="dashboard-contributors-card__item">
            <span>{getContributorLabel(row)}</span>
            <strong>{Number(row.count ?? 0)}</strong>
          </li>
        ))}
      </ul>
      <p className="dashboard-contributors-card__subtitle">
        {i18n.t('homeView:dashboard.contributorsCard.active', { count: activeContributors.length }) as string}
      </p>
      <ul className="dashboard-contributors-card__list">
        {activeContributors.map((row, index) => (
          <li key={row.owner_uuid ?? index} className="dashboard-contributors-card__item">
            <span>{getContributorLabel(row)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
