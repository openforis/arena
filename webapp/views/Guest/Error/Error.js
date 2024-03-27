import './Error.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

const Error = (props) => {
  const { error } = props
  const i18n = useI18n()
  if (!error) return null

  return <div className="guest-errors text-center">{i18n.t(error)}</div>
}

Error.propTypes = {
  error: PropTypes.string,
}

Error.defaultProps = {
  error: null,
}

export default Error
