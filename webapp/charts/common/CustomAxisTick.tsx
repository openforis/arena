import * as StringUtils from '@core/stringUtils'

const labelTextFill = '#666'

type CustomAxisTickProps = {
  labelRotation?: number
  payload: Record<string, any>
  labelMaxChars?: number
  x: number
  y: number
}

export const CustomAxisTick = (props: CustomAxisTickProps) => {
  const { labelRotation = 0, labelMaxChars = 14, payload, x, y } = props
  const { value } = payload
  const ellipsed = value.length > labelMaxChars
  const valueDisplay = StringUtils.truncate(labelMaxChars)(value)

  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={16} textAnchor="end" fill={labelTextFill} transform={`rotate(${labelRotation})`}>
        {ellipsed && <title>{value}</title>}
        {valueDisplay}
      </text>
    </g>
  )
}

export const RotatedCustomAxisTick = (props) => <CustomAxisTick {...props} labelRotation={-30} />
