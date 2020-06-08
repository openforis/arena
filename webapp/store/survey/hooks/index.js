import { useSelector } from 'react-redux'
import { SurveyStatusState } from '../status'

export const useSurveyDefsFetched = (draft) => useSelector(SurveyStatusState.areDefsFetched(draft))
