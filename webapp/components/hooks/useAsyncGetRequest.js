import useAsync from './useAsync'

export default (url, config = {}) => useAsync({ method: 'get', url, ...config })
