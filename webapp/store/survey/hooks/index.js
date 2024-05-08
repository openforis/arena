import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useOnUpdate } from '@webapp/components/hooks'

import * as SurveyState from '../state'
import { SurveyStatusState } from '../status'

// ==== Survey
export const useSurveyDefsFetched = ({ draft, includeAnalysis, validate }) =>
  useSelector(SurveyStatusState.isFetchedWithSameParams({ draft, includeAnalysis, validate }))
export const useSurvey = () => useSelector(SurveyState.getSurvey)
export const useSurveyId = () => useSelector(SurveyState.getSurveyId)
export const useSurveyInfo = () => useSelector(SurveyState.getSurveyInfo)
export const useSurveySrsIndex = () =>
  useSelector((state) => {
    const surveyInfo = SurveyState.getSurveyInfo(state)
    return Survey.getSRSIndex(surveyInfo)
  }, Objects.isEqual)
export const useSurveyCycleKey = () => useSelector(SurveyState.getSurveyCycleKey)
export const useSurveyCycleKeys = () => useSelector(SurveyState.getSurveyCyclesKeys, Objects.isEqual)
export const useSurveyPreferredLang = () => useSelector(SurveyState.getSurveyPreferredLang)

export const useSurveyLangs = () => Survey.getLanguages(useSurveyInfo())

export const useOnSurveyCycleUpdate = (effect) => {
  const surveyCycleKey = useSurveyCycleKey()
  useOnUpdate(effect, [surveyCycleKey])
}

export const useNodeDefRootKeys = () => Survey.getNodeDefRootKeys(useSurvey())

// ==== Node defs
export const useNodeDefByUuid = (uuid) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    return Survey.getNodeDefByUuid(uuid)(survey)
  })
export const useNodeDefsByUuids = (uuids) => Survey.getNodeDefsByUuids(uuids)(useSurvey())
export const useNodeDefLabel = (nodeDef, type) => NodeDef.getLabel(nodeDef, useSurveyPreferredLang(), type)
export const useNodeDefValidationByUuid = (uuid) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
    return Survey.getNodeDefValidation(nodeDef)(survey)
  })
export const useSurveyHasFileAttributes = () =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const fileDefs = Survey.findDescendants({ filterFn: NodeDef.isFile })(survey)
    return fileDefs.length > 0
  })
