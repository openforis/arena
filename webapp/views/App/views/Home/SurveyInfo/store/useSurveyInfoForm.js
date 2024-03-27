import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { ArrayUtils } from '@core/arrayUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { useFormObject } from '@webapp/components/hooks'
import { SurveyInfoActions, useSurveyInfo } from '@webapp/store/survey'

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

  // Setter methods
  const setDefaultCycleKey = (value) => setObjectField(Survey.infoKeys.defaultCycleKey, value)
  const setName = (value) => setObjectField(Survey.infoKeys.name, StringUtils.normalizeName(value))
  const setLanguages = (value) => setObjectField(Survey.infoKeys.languages, value)
  const setSrs = (value) => setObjectField(Survey.infoKeys.srs, value)
  const setSamplingPolygon = (value) => setObjectField(Survey.infoKeys.samplingPolygon, value)
  const setCycles = (value) => {
    const cycleKeysNext = Object.keys(value)
    const fieldsUpdated = { [Survey.infoKeys.cycles]: value }
    if (!cycleKeysNext.includes(defaultCycleKey)) {
      fieldsUpdated[Survey.infoKeys.defaultCycleKey] = ArrayUtils.last(cycleKeysNext)
    }
    return setObjectFields(fieldsUpdated)
  }

  const setLabels = (labels) => setObjectField(Survey.infoKeys.labels, labels)
  const setDescriptions = (descriptions) => setObjectField(Survey.infoKeys.descriptions, descriptions)

  const setSampleBasedImageInterpretationEnabled = (value) =>
    setObjectField(Survey.infoKeys.sampleBasedImageInterpretationEnabled, value)

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
    setLabels,
    setLanguages,
    setName,
    setSampleBasedImageInterpretationEnabled,
    setSamplingPolygon,
    setSrs,
  }
}
