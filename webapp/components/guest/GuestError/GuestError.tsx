import './GuestError.scss'

import { useI18n } from '@webapp/store/system'

type GuestErrorProps = {
  error?: string
}

const GuestError = (props: GuestErrorProps) => {
  const { error = null } = props
  const i18n = useI18n()
  if (!error) return null

  return (
    <div className="guest-errors" role="alert">
      {i18n.t(error)}
    </div>
  )
}

export default GuestError
