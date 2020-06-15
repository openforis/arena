import axios from 'axios'

import { useSurveyId } from '@webapp/store/survey'

export const useOnUpdate = ({ rowItem: item, setRowItem }) => {
  const surveyId = useSurveyId()
  const itemId = item.id

  return ({ resolved }) => {
    ;(async () => {
      const {
        data: { item: itemUpdated },
      } = await axios.post(`/api/survey/${surveyId}/collect-import/report/${itemId}/resolve`, {
        resolved,
      })
      setRowItem({ ...itemUpdated })
    })()
  }
}
