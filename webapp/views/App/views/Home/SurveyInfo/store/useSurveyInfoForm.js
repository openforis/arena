import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { ArrayUtils } from '@core/arrayUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { SurveyInfoActions, useSurveyInfo } from '@webapp/store/survey'

import { useFormObject } from '@webapp/components/hooks'

export const useSurveyInfoForm = () => {
  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()

  const { object, setObjectField, setObjectFields, enableValidation, getFieldValidation, setValidation } =
    useFormObject({
      ...ObjectUtils.getProps(surveyInfo),
      defaultCycleKey: Survey.getDefaultCycleKey(surveyInfo),
    })

  const { defaultCycleKey, cycles } = object
  const cycleKeys = useMemo(() => Object.keys(cycles), [cycles])

  useEffect(() => {
    setValidation(Validation.getValidation(surveyInfo))
  }, [surveyInfo])

  // Setters
  const setCycles = (value) => {
    const cycleKeysNext = Object.keys(value)
    const fieldsUpdated = { [Survey.infoKeys.cycles]: value }
    if (!cycleKeysNext.includes(defaultCycleKey)) {
      fieldsUpdated[Survey.infoKeys.defaultCycleKey] = ArrayUtils.last(cycleKeysNext)
    }
    return setObjectFields(fieldsUpdated)
  }
  const setDefaultCycleKey = (value) => setObjectField(Survey.infoKeys.defaultCycleKey, value)
  const setDescriptions = (descriptions) => setObjectField(Survey.infoKeys.descriptions, descriptions)
  const setFieldManualLinks = (links) => setObjectField(Survey.infoKeys.fieldManualLinks, links)
  const setName = (value) => setObjectField(Survey.infoKeys.name, StringUtils.normalizeName(value))
  const setLabels = (labels) => setObjectField(Survey.infoKeys.labels, labels)
  const setLanguages = (value) => setObjectField(Survey.infoKeys.languages, value)
  const setSampleBasedImageInterpretationEnabled = (value) =>
    setObjectField(Survey.infoKeys.sampleBasedImageInterpretationEnabled, value)
  const setSamplingPolygon = (value) => setObjectField(Survey.infoKeys.samplingPolygon, value)
  const setSecurity = (value) => setObjectField(Survey.infoKeys.security, value)
  const setSrs = (value) => setObjectField(Survey.infoKeys.srs, value)
  const setUserExtraPropDefs = (value) => setObjectField(Survey.infoKeys.userExtraPropDefs, value)

  const saveProps = () => {
    enableValidation()
    dispatch(SurveyInfoActions.updateSurveyInfoProps(object))
  }

  return {
    ...object,
    cycleKeys,
    getFieldValidation,
    saveProps,
    setCycles,
    setDefaultCycleKey,
    setDescriptions,
    setFieldManualLinks,
    setLabels,
    setLanguages,
    setName,
    setSampleBasedImageInterpretationEnabled,
    setSamplingPolygon,
    setSecurity,
    setSrs,
    setUserExtraPropDefs,
  }
}
