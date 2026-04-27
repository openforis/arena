import * as DomUtils from '@webapp/utils/domUtils'

export const SERVICE_ERROR_CREATE = 'service/error/create'
export const SERVICE_ERROR_DELETE = 'service/error/delete'

export const closeServiceError = (error) => (dispatch) => dispatch({ type: SERVICE_ERROR_DELETE, error })
export const createServiceError =
  ({ error }) =>
  (dispatch) => {
    let message
    if (typeof error === 'object') {
      message = error.message
    } else {
      const htmlText = error?.response?.data?.error
      message = DomUtils.extractPreElementContentFromHtml(htmlText)
    }
    if (!message) {
      message = error.message
    }
    return dispatch({ type: SERVICE_ERROR_CREATE, error: { ...error, message } })
  }
