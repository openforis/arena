import React, { useMemo } from 'react'

import * as StringUtils from '@core/stringUtils'

import { ServiceErrorActions, useI18n } from '@webapp/store/system'

import Markdown from '@webapp/components/markdown'
import { useAppDispatch } from '@webapp/store'

const appErrorsNamespace = 'appErrors:'
const _toMessageKey = (key) => [key, StringUtils.prependIfMissing(appErrorsNamespace)(key)]

const defaultError: { key: string; params?: Record<string, unknown> } = { key: 'appErrors:networkError' }

type ServiceErrorProps = {
  error: Record<string, any>
}

const ServiceError = React.forwardRef<HTMLDivElement, ServiceErrorProps>((props, ref) => {
  const { error } = props
  const i18n = useI18n()
  const dispatch = useAppDispatch()

  const { response, message: errorMessage } = error
  const { data, status = '' } = response || {}

  const message = useMemo(() => {
    if (data) {
      const { key, params } = data
      if (key) {
        return i18n.t(_toMessageKey(key), params)
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

export default ServiceError
