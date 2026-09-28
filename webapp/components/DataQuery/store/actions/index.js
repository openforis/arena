import { useFetchData } from './useFetchData'
import { useFetchCount } from './useFetchCount'

export const useActions = ({ setData, setCount }) => {
  const { fetchData, resetData } = useFetchData({ setData })
  const { fetchCount, resetCount } = useFetchCount({ setCount })

  const reset = () => {
    resetData()
    resetCount()
  }

  return {
    fetchData,
    fetchCount,
    reset,
    resetData,
    resetCount,
  }
}
