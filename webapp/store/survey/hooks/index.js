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

export const useNodeDefRootKeys = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const root = Survey.getNodeDefRoot(survey)
  return Survey.getNodeDefKeysSorted({ nodeDef: root, cycle })(survey)
}

export const useCategoryByName = (name) =>
  useSelector((state) => {
    if (!name) return null
    const survey = SurveyState.getSurvey(state)
    return Survey.getCategoryByName(name)(survey)
  })

export const useTaxonomies = () =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    return Survey.getTaxonomiesArray(survey)
  }, Objects.isEqual)

export const useTaxonomyByUuid = (uuid) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    return Survey.getTaxonomyByUuid(uuid)(survey)
  })

export const useTaxonomyByName = (name) =>
  useSelector((state) => {
    if (!name) return null
    const survey = SurveyState.getSurvey(state)
    return Survey.getTaxonomyByName(name)(survey)
  })

// ==== Node defs
export const useNodeDefByUuid = (uuid) =>
  useSelector((state) => {
    if (!uuid) return null
    const survey = SurveyState.getSurvey(state)
    return Survey.getNodeDefByUuid(uuid)(survey)
  })
export const useNodeDefByName = (name) =>
  useSelector((state) => {
    if (!name) return null
    const survey = SurveyState.getSurvey(state)
    return Survey.getNodeDefByName(name)(survey)
  })

export const useNodeDefsByUuids = (uuids) =>
  useSelector((state) => {
    if (!uuids?.length) return []
    const survey = SurveyState.getSurvey(state)
    return Survey.getNodeDefsByUuids(uuids)(survey)
  }, Objects.isEqual)

export const useNodeDefsByNames = (names) =>
  useSelector((state) => {
    if (!names?.length) return []
    const survey = SurveyState.getSurvey(state)
    return names.map((name) => Survey.getNodeDefByName(name)(survey))
  }, Objects.isEqual)

export const useNodeDefLabel = (nodeDef, type) => NodeDef.getLabel(nodeDef, useSurveyPreferredLang(), type)

export const useNodeDefValidationByUuid = (uuid) =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
    return Survey.getNodeDefValidation(nodeDef)(survey)
  }, Objects.isEqual)

export const useSurveyHasFileAttributes = () =>
  useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const fileDefs = Survey.findDescendants({ filterFn: NodeDef.isFile })(survey)
    return fileDefs.length > 0
  })
