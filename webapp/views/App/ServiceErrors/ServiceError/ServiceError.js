import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { ServiceErrorActions, useI18n } from '@webapp/store/system'

import Markdown from '@webapp/components/markdown'

const defaultError = { key: 'appErrors:networkError' }

const ServiceError = React.forwardRef((props, ref) => {
  const { error } = props
  const i18n = useI18n()
  const dispatch = useDispatch()

  const { response } = error
  const { data, status = '' } = response || {}
  const { key, params } = data ?? defaultError

  return (
    <div ref={ref} className="service-errors__error">
      <button
        type="button"
        className="btn-s btn-close"
        onClick={() => dispatch(ServiceErrorActions.closeServiceError(error))}
      >
        <span className="icon icon-cross icon-12px" />
      </button>

      <div className="status">ERROR {status}</div>
      <Markdown className="message" source={i18n.t(key, params)} />
    </div>
  )
})

ServiceError.displayName = 'ServiceError'

ServiceError.propTypes = {
  error: PropTypes.object.isRequired,
}

export default ServiceError
