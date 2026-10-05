import useAsync from './useAsync'

const useAsyncGetRequest = (url, config = {}) => useAsync({ method: 'get', url, ...config })

export default useAsyncGetRequest
