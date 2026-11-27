import { AppInfo } from '@core/app/appInfo'
import { CreatedWithAppIcon } from '@webapp/components/CreatedWithAppIcon'
import { useI18n } from '@webapp/store/system'

const stackedIconOffset = 12
const stackedIconZindexStart = 5

const getSortedAppCountsEntries = (recordsCountByApp: Record<string, number>) =>
  Object.entries(recordsCountByApp).sort(([_id1, count1], [_id2, count2]) => count2 - count1)

type RecordsCountIconProps = {
  item: Record<string, any>
}

export const RecordsCountIcon = (props: RecordsCountIconProps) => {
  const { item } = props
  const { recordsCount, recordsCountByApp = {} } = item

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
          <CreatedWithAppIcon
            key={appId}
            appId={appId}
            style={{ zIndex: stackedIconZindexStart - index, left: `${stackedIconOffset * index}px` }}
            title={multipleApps ? countSummary : undefined}
          />
        ))}
      </span>
    </div>
  )
}
