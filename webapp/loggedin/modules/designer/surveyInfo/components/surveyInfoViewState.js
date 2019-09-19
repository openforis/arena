import React, { useEffect } from 'react'
import * as R from 'ramda'

import { useFormObject } from '../../../../../commonComponents/hooks'

import StringUtils from '../../../../../../common/stringUtils'
import ObjectUtils from '../../../../../../common/objectUtils'
import Validation from '../../../../../../common/validation/validation'

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
  const setName = value => setObjectField('name', StringUtils.normalizeName(value))
  const setLanguages = value => setObjectField('languages', value)
  const setSrs = value => setObjectField('srs', value)

  const setFieldLabel = (field, items) => item => {
    const itemsUpdate = R.assoc(item.lang, item.label, items)
    setObjectField(field, itemsUpdate)
  }
  const setLabel = setFieldLabel('labels', object.labels)
  const setDescription = setFieldLabel('descriptions', object.descriptions)

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
    getFieldValidation,
    saveProps,
  }

}