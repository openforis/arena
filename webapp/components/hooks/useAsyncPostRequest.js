import useAsync from './useAsync'

const useAsyncPostRequest = (url, data = {}, config = {}) => useAsync({ method: 'post', url, data, ...config })

export default useAsyncPostRequest
