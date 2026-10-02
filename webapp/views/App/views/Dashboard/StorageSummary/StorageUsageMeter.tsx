import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { defaultTokens } from '@webapp/theme/tokens'

type StorageUsageMeterProps = {
  percent: number
}

const WARN_THRESHOLD = 70
const CRITICAL_THRESHOLD = 85

/**
 * Picks the fill color for a storage usage percent.
 *
 * @param {number} percent - Used space as a percentage of total (0–100).
 * @returns {string} Arena token color.
 */
export const getStorageUsageFillColor = (percent: number): string => {
  if (percent >= CRITICAL_THRESHOLD) return defaultTokens.colors.red
  if (percent >= WARN_THRESHOLD) return defaultTokens.colors.orange
  return defaultTokens.colors.green
}

/**
 * Horizontal storage usage meter with threshold-based fill color.
 *
 * @param {StorageUsageMeterProps} props - The component props.
 * @returns {React.ReactElement} The meter.
 */
export const StorageUsageMeter = (props: StorageUsageMeterProps) => {
  const { percent } = props
  const clamped = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0
  const fillColor = getStorageUsageFillColor(clamped)

  return (
    <Box sx={{ width: '100%', maxWidth: 360 }} role="meter" aria-valuenow={Math.floor(clamped)} aria-valuemin={0} aria-valuemax={100}>
      <Box
        sx={{
          height: 10,
          borderRadius: '999px',
          bgcolor: defaultTokens.colors.grey,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${clamped}%`,
            height: '100%',
            borderRadius: '999px',
            bgcolor: fillColor,
            transition: 'width 160ms ease, background-color 160ms ease',
          }}
        />
      </Box>
      <Typography
        component="span"
        sx={{
          display: 'block',
          mt: 0.75,
          fontSize: '0.75rem',
          color: defaultTokens.colors.blueDark,
          fontWeight: 600,
        }}
      >
        {Math.floor(clamped)}%
      </Typography>
    </Box>
  )
}
