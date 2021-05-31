import useAsync from './useAsync'

export default (url, data = {}, config = {}) => useAsync({ method: 'post', url, data, ...config })
