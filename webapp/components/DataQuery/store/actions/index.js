import { useFetchData } from './useFetchData'

export const useActions = ({ setData }) => {
  const { fetchData, resetData } = useFetchData({ setData })

  return {
    fetchData,
    resetData,
  }
}
