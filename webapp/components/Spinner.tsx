import { CircularProgress } from '@mui/material'

type SpinnerProps = {
  size?: number
}

export const Spinner = (props: SpinnerProps) => {
  const { size = 40 } = props

  return <CircularProgress size={size} />
}
