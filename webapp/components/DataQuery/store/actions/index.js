import { useFetchCount } from './useFetchCount'
import { useFetchData } from './useFetchData'

export const useActions = ({ setData, setCount }) => {
  const { fetchData, resetData } = useFetchData({ setData })
  const { fetchCount, resetCount } = useFetchCount({ setCount })

  const fetch = ({ offset, limit, query, includesCount = true }) => {
    fetchData({ offset, limit, query })
    if (includesCount) fetchCount({ query })
  }

  const reset = () => {
    resetData()
    resetCount()
  }

  return {
    fetch,
    reset,
  }
}
