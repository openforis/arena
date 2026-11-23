import axios from 'axios'
import { useEffect, useRef, useState } from 'react'

/**
 * Sends a request using the specified function and cancels the request on unmount.
 *
 * @param {!object} params - The parameters.
 * @param {boolean} [params.condition=true] - Whether to execute the request on dependencies update.
 * @param {object} [params.defaultValue=null] - The default value returned.
 * @param {Array} [params.dependencies=[]] - Effect dependencies (the request will be performed again when they change).
 * @param {Function} [params.requestFunction] - The request function.
 * @param {Array} [params.requestArguments=[]] - The request arguments.
 * @returns {object} - The content of response.
 */
export const useRequest = ({
  condition = true,
  defaultValue = null,
  dependencies = [],
  requestFunction,
  requestArguments,
  prepareData = (data) => data,
  handleError = null,
}) => {
  const [data, setData] = useState(defaultValue)
  const cancelRequestRef = useRef(null)

  useEffect(() => {
    if (condition) {
      const { request, cancel } = requestFunction(...requestArguments)
      cancelRequestRef.current = cancel

      request
        .then(({ data: dataResponse }) => {
          setData(prepareData(dataResponse))
        })
        .catch((err) => {
          // canceled
          if (err && !axios.isCancel(err)) {
            handleError?.(err)
          }
        })
    }
    return () => {
      if (cancelRequestRef.current) {
        cancelRequestRef.current()
      }
    }
  }, dependencies)

  return data
}
