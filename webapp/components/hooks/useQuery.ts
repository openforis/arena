import { useLocation } from 'react-router'

export const useQuery = (): Record<string, string> => {
  const params = new URLSearchParams(useLocation().search)
  return Object.fromEntries(params)
}
