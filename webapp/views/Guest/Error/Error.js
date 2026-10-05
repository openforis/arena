import './Error.scss'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const GuestError = (props) => {
  const { error = null } = props
  const i18n = useI18n()
  if (!error) return null

  return <div className="guest-errors text-center">{i18n.t(error)}</div>
}

GuestError.propTypes = {
  error: PropTypes.string,
}

export default GuestError
