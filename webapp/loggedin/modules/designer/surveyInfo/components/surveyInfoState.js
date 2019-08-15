import React, { useEffect } from 'react'
import * as R from 'ramda'

import { getLanguageLabel } from '../../../../../../common/app/languages'
import { useAsyncPutRequest, useFormObject } from '../../../../../commonComponents/hooks'

import Survey from '../../../../../../common/survey/survey'
import Validator from '../../../../../../common/validation/validator'
import StringUtils from '../../../../../../common/stringUtils'

const getLanguageItems = langs => langs.map(lang => ({
  key: lang, value: getLanguageLabel(lang)
}))

export const useSurveyInfoState = props => {

  const { surveyInfo, updateSurveyInfo } = props
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)

  const obj = {
    name: Survey.getName(surveyInfo),
    languages: getLanguageItems(Survey.getLanguages(surveyInfo)),
    srs: Survey.getSRS(surveyInfo),
    labels: Survey.getLabels(surveyInfo),
    descriptions: Survey.getDescriptions(surveyInfo),
  }

  const {
    object, objectValid,
    setObjectField, enableValidation, getFieldValidation
  } = useFormObject(obj, null, Validator.getValidation(surveyInfo))

  const { data, error, dispatch } = useAsyncPutRequest(
    `/api/survey/${surveyId}/info`,
    { ...object }
  )

  // setter methods
  const setName = value => setObjectField('name', StringUtils.normalizeName(value))
  const setLanguageCodes = value => {
    const langs = getLanguageItems(value)
    setObjectField('languages', langs)
  }
  const setSrs = value => setObjectField('srs', value)

  const setFieldLabel = (field, items) => item => {
    const itemsUpdate = R.assoc(item.lang, item.label, items)
    setObjectField(field, itemsUpdate)
  }
  const setLabel = setFieldLabel('labels', object.labels)
  const setDescription = setFieldLabel('descriptions', object.descriptions)

  return {
    ...object,
    setName,
    setLanguageCodes,
    setSrs,
    setLabel,
    setDescription,
    getFieldValidation,
  }

}