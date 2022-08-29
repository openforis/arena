import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

import { SurveyInfoActions, useSurveyInfo } from '@webapp/store/survey'

import { useFormObject } from '@webapp/components/hooks'

export const useSurveyInfoForm = () => {
  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()

  const { object, setObjectField, enableValidation, getFieldValidation, setValidation } = useFormObject(
    ObjectUtils.getProps(surveyInfo),
    null
  )

  useEffect(() => {
    setValidation(Validation.getValidation(surveyInfo))
  }, [surveyInfo])

  // Setter methods
  const setName = (value) => setObjectField(Survey.infoKeys.name, StringUtils.normalizeName(value))
  const setLanguages = (value) => setObjectField(Survey.infoKeys.languages, value)
  const setSrs = (value) => setObjectField(Survey.infoKeys.srs, value)
  const setSamplingPolygon = (value) => setObjectField(Survey.infoKeys.samplingPolygon, value)
  const setCycles = (value) => setObjectField(Survey.infoKeys.cycles, value)

  const setLabels = (labels) => setObjectField(Survey.infoKeys.labels, labels)
  const setDescriptions = (descriptions) => setObjectField(Survey.infoKeys.descriptions, descriptions)

  const saveProps = () => {
    enableValidation()
    dispatch(SurveyInfoActions.updateSurveyInfoProps(object))
  }

  return {
    ...object,
    setName,
    setLanguages,
    setSrs,
    setSamplingPolygon,
    setLabels,
    setDescriptions,
    setCycles,
    getFieldValidation,
    saveProps,
  }
}
