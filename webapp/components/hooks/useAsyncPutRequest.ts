import useAsync from './useAsync'

const useAsyncPutRequest = (url, data = {}, config = {}) => useAsync({ method: 'put', url, data, ...config })

export default useAsyncPutRequest
