import './ChartWrapper.scss'

import type React from 'react'
import { ResponsiveContainer } from 'recharts'

type ChartWrapperProps = {
  children?: React.ReactNode
  height?: number | `${number}%`
  width?: number | `${number}%`
}

export const ChartWrapper = (props: ChartWrapperProps) => {
  const { children, height = '100%', width = '100%' } = props

  return (
    <ResponsiveContainer height={height} width={width}>
      {children}
    </ResponsiveContainer>
  )
}
