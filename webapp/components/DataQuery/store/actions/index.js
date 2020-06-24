import { useFetchData } from './useFetchData'

export const useActions = ({ setData }) => ({
  fetchData: useFetchData({ setData }),
})
