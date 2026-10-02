import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { defaultTokens } from '@webapp/theme/tokens'
import { FileUtils } from '@webapp/utils/fileUtils'

import { StorageUsageMeter } from './StorageUsageMeter'

type StorageStatistics = {
  usedSpace?: number
  totalSpace?: number
}

type StorageSummaryItemProps = {
  statistics: StorageStatistics
  titleKey: string
}

/**
 * Computes used space as a percentage of total, clamped to 0–100.
 *
 * @param {StorageStatistics} statistics - Used and total byte counts.
 * @returns {number} Usage percent.
 */
const getUsePercent = (statistics: StorageStatistics): number => {
  const { usedSpace, totalSpace } = statistics
  if (typeof usedSpace !== 'number' || typeof totalSpace !== 'number' || totalSpace <= 0) return 0
  return Math.min(100, Math.max(0, (usedSpace * 100) / totalSpace))
}

/**
 * One storage category (files or database) with title, subtitle, and progress meter.
 *
 * @param {StorageSummaryItemProps} props - The component props.
 * @returns {React.ReactElement} The item.
 */
const StorageSummaryItem = (props: StorageSummaryItemProps) => {
  const { statistics, titleKey } = props
  const i18n = useI18n()

  const usedSpace = typeof statistics.usedSpace === 'number' ? statistics.usedSpace : 0
  const totalSpace = typeof statistics.totalSpace === 'number' ? statistics.totalSpace : 0
  const usePercent = getUsePercent(statistics)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        flex: '1 1 240px',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <Typography
        component="h4"
        sx={{
          m: 0,
          fontSize: '0.95rem',
          fontWeight: 600,
          color: defaultTokens.colors.blueDark,
        }}
      >
        {i18n.t(titleKey) as string}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: '0.85rem',
          color: defaultTokens.colors.black,
        }}
      >
        {i18n.t('homeView:dashboard.storageSummary.usedSpaceOutOf', {
          percent: Math.floor(usePercent),
          used: FileUtils.toHumanReadableFileSize(usedSpace),
          total: FileUtils.toHumanReadableFileSize(totalSpace),
        }) as string}
      </Typography>
      <StorageUsageMeter percent={usePercent} />
    </Box>
  )
}

/**
 * Files and database storage usage meters for the Storage KPI details.
 *
 * @returns {React.ReactElement} The storage summary.
 */
export const StorageSummary = () => {
  const surveyInfo = useSurveyInfo()
  const filesStatistics = Survey.getFilesStatistics(surveyInfo) as StorageStatistics
  const dbStatistics = Survey.getDbStatistics(surveyInfo) as StorageStatistics

  return (
    <Box
      className="storage-summary-container"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        width: '100%',
        py: 0.5,
      }}
    >
      <StorageSummaryItem statistics={filesStatistics} titleKey="homeView:dashboard.storageSummaryFiles.title" />
      <StorageSummaryItem statistics={dbStatistics} titleKey="homeView:dashboard.storageSummaryDb.title" />
    </Box>
  )
}
