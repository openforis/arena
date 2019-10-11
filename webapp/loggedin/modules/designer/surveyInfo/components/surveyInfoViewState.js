import React, { useEffect } from 'react'
import * as R from 'ramda'

import { useFormObject } from '../../../../../commonComponents/hooks'

import Survey from '../../../../../../core/survey/survey'
import StringUtils from '../../../../../../core/stringUtils'
import ObjectUtils from '../../../../../../core/objectUtils'
import Validation from '../../../../../../core/validation/validation'

export const useSurveyInfoViewState = props => {

  const { surveyInfo, updateSurveyInfoProps, } = props

  const {
    object,
    setObjectField, enableValidation, getFieldValidation, setValidation
  } = useFormObject(ObjectUtils.getProps(surveyInfo), null)

  useEffect(() => {
    setValidation(Validation.getValidation(surveyInfo))
  }, [surveyInfo])

  // setter methods
  const setName = value => setObjectField(Survey.infoKeys.name, StringUtils.normalizeName(value))
  const setLanguages = value => setObjectField(Survey.infoKeys.languages, value)
  const setSrs = value => setObjectField(Survey.infoKeys.srs, value)
  const setCycles = value => setObjectField(Survey.infoKeys.cycles, value)

  const setFieldLabel = (field, items) => item => {
    const itemsUpdate = R.assoc(item.lang, item.label, items)
    setObjectField(field, itemsUpdate)
  }
  const setLabel = setFieldLabel(Survey.infoKeys.labels, object.labels)
  const setDescription = setFieldLabel(Survey.infoKeys.descriptions, object.descriptions)

  const saveProps = () => {
    enableValidation()
    updateSurveyInfoProps(object)
  }

  return {
    ...object,
    setName,
    setLanguages,
    setSrs,
    setLabel,
    setDescription,
    setCycles,
    getFieldValidation,
    saveProps,
  }

}