import React from 'react'
import PropTypes from 'prop-types'

import { AppInfo } from '@core/app/appInfo'

const arenaMobileId = 'am'

const getAppIdWithMoreRecords = (recordsCountByApp) => {
  const sortedEntries = Object.entries(recordsCountByApp).sort(
    ({ count: count1 }, { count: count2 }) => count1 - count2
  )
  return sortedEntries[0]?.[0] ?? AppInfo.arenaAppId
}

const iconByAppId = {
  [AppInfo.arenaAppId]: 'of_arena_icon.png',
  [arenaMobileId]: 'of_arena_mobile_icon.png',
}

const unknownAppIcon = 'question_mark_icon_32x32.png'

const appNameById = {
  [AppInfo.arenaAppId]: 'Arena',
  [arenaMobileId]: 'Arena Mobile',
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
