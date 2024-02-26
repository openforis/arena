import React from 'react'
import PropTypes from 'prop-types'

import { AppInfo } from '@core/app/appInfo'

const getAppIdWithMoreRecords = (recordsCountByApp) => {
  const sortedEntries = Object.entries(recordsCountByApp).sort(
    ({ count: count1 }, { count: count2 }) => count1 - count2
  )
  const firstEntry = sortedEntries[0]
  const firstEntryKey = firstEntry?.[0]
  return firstEntryKey ?? AppInfo.arenaAppId
}

const iconByAppId = {
  [AppInfo.arenaAppId]: 'of_arena_icon.png',
  [AppInfo.arenaMobileId]: 'of_arena_mobile_icon.png',
}

const unknownAppIcon = 'question_mark_icon_20x20.png'

const appNameById = {
  [AppInfo.arenaAppId]: 'Arena',
  [AppInfo.arenaMobileId]: 'Arena Mobile',
}

export const RecordsCountIcon = (props) => {
  const { item } = props
  const { recordsCount, recordsCountByApp } = item

  const moreRecordsAppId = getAppIdWithMoreRecords(recordsCountByApp)
  const icon = iconByAppId[moreRecordsAppId] ?? unknownAppIcon
  const appName = appNameById[moreRecordsAppId] ?? moreRecordsAppId
  return (
    <div className="records-count">
      <span>{recordsCount}</span>
      <img src={`/img/${icon}`} height={20} alt={moreRecordsAppId} title={appName} />
    </div>
  )
}

RecordsCountIcon.propTypes = {
  item: PropTypes.object.isRequired,
}
