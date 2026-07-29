import React from 'react'

import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import { useI18n } from '@webapp/store/system'
import { useRecordCompletionPercent } from '@webapp/store/ui/record'

/**
 * Displays a linear progress bar and percentage label for the current record's
 * completion. Renders nothing when the arena-core completion API is unavailable
 * or no record is loaded.
 *
 * @returns {React.ReactElement | null} The progress bar, or null when unavailable.
 */
export const RecordCompletionBar = () => {
  const i18n = useI18n()
  const percent = useRecordCompletionPercent()

  if (percent === null) return null

  return (
    <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
      <LinearProgress variant="determinate" value={percent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {i18n.t('surveyForm:completion', { percent: Math.round(percent) })}
      </Typography>
    </Box>
  )
}
