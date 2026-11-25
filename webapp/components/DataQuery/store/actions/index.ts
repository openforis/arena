import { useFetchCount } from './useFetchCount'
import { useFetchData } from './useFetchData'

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
