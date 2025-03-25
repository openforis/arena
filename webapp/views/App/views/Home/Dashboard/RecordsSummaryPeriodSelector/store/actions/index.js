import { useGetRecordsSummary } from './useGetRecordsSummary'

export const useActions = ({ recordsSummary, setRecordsSummary }) => ({
  onGetRecordsSummary: useGetRecordsSummary({ recordsSummary, setRecordsSummary }),
})
