import React from 'react'

import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import { useI18n } from '@webapp/store/system'
import { useRecordPagesValidationProgress } from '@webapp/store/ui/record'

/**
 * Displays progress of pages without validation errors over all survey pages.
 * Aligns with sidebar red status icons (errors only).
 *
 * @returns Progress bar, or null when no record / no pages
 */
export const RecordCompletionBar = () => {
  const i18n = useI18n()
  const progress = useRecordPagesValidationProgress()

  if (!progress) return null

  const { percent, validCount, totalCount } = progress

  return (
    <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
      <LinearProgress variant="determinate" value={percent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {i18n.t('surveyForm:pagesValidationProgress', { valid: validCount, total: totalCount, percent })}
      </Typography>
    </Box>
  )
}
