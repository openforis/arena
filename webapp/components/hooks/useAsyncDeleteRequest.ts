import useAsync from './useAsync'

const useAsyncDeleteRequest = (url, config = {}) => useAsync({ method: 'delete', url, ...config })

export default useAsyncDeleteRequest
