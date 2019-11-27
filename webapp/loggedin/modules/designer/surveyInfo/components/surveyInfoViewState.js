import React, { useEffect } from 'react'
import * as R from 'ramda'

import { useFormObject } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

export const useSurveyInfoViewState = props => {
  const { surveyInfo, updateSurveyInfoProps } = props

  const {
    object,
    setObjectField,
    enableValidation,
    getFieldValidation,
    setValidation,
  } = useFormObject(ObjectUtils.getProps(surveyInfo), null)

  useEffect(() => {
    setValidation(Validation.getValidation(surveyInfo))
  }, [surveyInfo])

  // Setter methods
  const setName = value =>
    setObjectField(Survey.infoKeys.name, StringUtils.normalizeName(value))
  const setLanguages = value => setObjectField(Survey.infoKeys.languages, value)
  const setSrs = value => setObjectField(Survey.infoKeys.srs, value)
  const setCycles = value => setObjectField(Survey.infoKeys.cycles, value)

  const setLabels = labels => setObjectField(Survey.infoKeys.labels, labels)
  const setDescriptions = descriptions =>
    setObjectField(Survey.infoKeys.descriptions, descriptions)

  const saveProps = () => {
    enableValidation()
    updateSurveyInfoProps(object)
  }

  return {
    ...object,
    setName,
    setLanguages,
    setSrs,
    setLabels,
    setDescriptions,
    setCycles,
    getFieldValidation,
    saveProps,
  }
}
