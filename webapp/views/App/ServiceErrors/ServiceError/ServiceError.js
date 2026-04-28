import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { ServiceErrorActions, useI18n } from '@webapp/store/system'

import Markdown from '@webapp/components/markdown'

const defaultError = { key: 'appErrors:networkError' }

const ServiceError = React.forwardRef((props, ref) => {
  const { error } = props
  const i18n = useI18n()
  const dispatch = useDispatch()

  const { response, message: errorMessage } = error
  const { data, status = '' } = response || {}

  const message = useMemo(() => {
    if (data) {
      const { key, params } = data
      if (key) {
        return i18n.t(key, params)
      }
    }
    return errorMessage ?? i18n.t(defaultError.key, defaultError.params)
  }, [data, errorMessage, i18n])

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
      <Markdown className="message" source={message} />
    </div>
  )
})

ServiceError.displayName = 'ServiceError'

ServiceError.propTypes = {
  error: PropTypes.object.isRequired,
}

export default ServiceError
