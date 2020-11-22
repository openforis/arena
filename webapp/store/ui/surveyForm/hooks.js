import { useSelector } from 'react-redux'
import * as SurveyFormState from './state'

export const useNodeDefLabelType = () => useSelector(SurveyFormState.getNodeDefLabelType)

export const useNodeDefPage = () => useSelector(SurveyFormState.getFormActivePageNodeDef)

export const useShowPageNavigation = () => useSelector(SurveyFormState.showPageNavigation)

export const usePagesUuidMap = () => useSelector(SurveyFormState.getPagesUuidMap)
