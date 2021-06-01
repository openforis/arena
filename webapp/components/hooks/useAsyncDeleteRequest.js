import useAsync from './useAsync'

export default (url, config = {}) => useAsync({ method: 'delete', url, ...config })
