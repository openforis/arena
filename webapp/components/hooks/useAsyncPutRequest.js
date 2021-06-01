import useAsync from './useAsync'

export default (url, data = {}, config = {}) => useAsync({ method: 'put', url, data, ...config })
