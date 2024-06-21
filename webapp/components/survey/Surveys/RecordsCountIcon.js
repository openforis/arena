import React from 'react'
import PropTypes from 'prop-types'

import { AppInfo } from '@core/app/appInfo'

import { AppIcon } from '@webapp/components/AppIcon'
import { useI18n } from '@webapp/store/system'

const multipleAppsIconOffset = 8
const appIconZindexStart = 5

const getSortedAppCountsEntries = (recordsCountByApp) =>
  Object.entries(recordsCountByApp).sort(([_id1, count1], [_id2, count2]) => count2 - count1)

export const RecordsCountIcon = (props) => {
  const { item } = props
  const { recordsCount, recordsCountByApp } = item

  const i18n = useI18n()

  const sortedAppCountsEntries = getSortedAppCountsEntries(recordsCountByApp)
  const multipleApps = sortedAppCountsEntries.length > 1

  const countSummary = multipleApps
    ? `${i18n.t('surveysView.recordsCreatedWithMoreApps')} 
${sortedAppCountsEntries
  .map(([appId, count]) => {
    const appName = AppInfo.getAppNameById(appId)
    return `${appName}: ${count}`
  })
  .join('\n')}`
    : undefined

  return (
    <div className="records-count">
      <span>{recordsCount}</span>
      <span className="app-icons-wrapper">
        {sortedAppCountsEntries.map(([appId], index) => (
          <AppIcon
            key={appId}
            appId={appId}
            style={{
              position: 'absolute',
              zIndex: appIconZindexStart - index,
              left: `${multipleAppsIconOffset * index}px`,
            }}
            title={multipleApps ? countSummary : undefined}
          />
        ))}
      </span>
    </div>
  )
}

RecordsCountIcon.propTypes = {
  item: PropTypes.object.isRequired,
}
