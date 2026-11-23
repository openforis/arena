import type React from 'react'
import MuiChip from '@mui/material/Chip'
import classNames from 'classnames'

type ChipProps = {
  className?: string
  label: React.ReactNode
  readOnly?: boolean
  onDelete?: (...args: any[]) => any
  variant?: 'filled' | 'outlined'
}

const Chip = (props: ChipProps) => {
  const { className, onDelete = null, label, readOnly = false, variant = 'outlined' } = props

  return (
    <MuiChip
      className={classNames(className)}
      onDelete={!readOnly ? onDelete : undefined}
      label={label}
      variant={variant}
    />
  )
}

export default Chip
