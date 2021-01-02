import { useLocation } from 'react-router-dom'

export const useQuery = () => {
  const params = new URLSearchParams(useLocation().search)
  return [...params].reduce((acc, param) => ({ ...acc, [param[0]]: param[1] }), {})
}
