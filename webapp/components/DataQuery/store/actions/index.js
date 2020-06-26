import { useFetchData } from './useFetchData'
import { useFetchCount } from './useFetchCount'

export const useActions = ({ setData, setCount }) => {
  const { fetchData, resetData } = useFetchData({ setData })
  const { fetchCount, resetCount } = useFetchCount({ setCount })

  return {
    fetchData,
    resetData,
    fetchCount,
    resetCount,
  }
}
