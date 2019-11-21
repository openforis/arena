import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as RecordValidations from '@core/record/recordValidation'

// import * as RecordValidation from '@core/record/recordValidation'

import * as SurveyState from '@webapp/survey/surveyState'

import Markdown from '../commonComponents/markdown'


const getErrorText = i18n => error =>
  ValidationResult.hasMessages(error)
    ? ValidationResult.getMessage(i18n.lang)(error)
    : i18n.t(ValidationResult.getKey(error), ValidationResult.getParams(error))

const getValidationErrorMessages = i18n => validation => R.pipe(
  Validation.getErrors,
  R.concat(Validation.getWarnings(validation)),
  R.map(getErrorText(i18n)),
)(validation)

const getValidationFieldErrorMessage = (i18n, field) => R.pipe(
  getValidationErrorMessages(i18n),
  R.ifElse(
    R.isEmpty,
    () => getErrorText(i18n)(
      ValidationResult.newInstance(
        Validation.messageKeys.invalidField, //default error message
        { field }
      )
    ),
    R.join(', ')
  )
)

const getValidationFieldMessages = (i18n, showKeys = true, survey = {}) => validation => R.pipe(
  Validation.getFieldValidations,
  Object.entries,
  // extract invalid fields error messages
  R.map(([field, fieldValidation]) => {
    // if it's a childrenCount validation, extract the actual minCount or maxCount validation
    // and add the nodeDefUuid name as param
    if (field === RecordValidations.keys.childrenCount) {
      const [nodeDefUuid, nodeValidation] = Object.entries(Validation.getFieldValidations(fieldValidation))[0]
      const [k, v] = Object.entries(Validation.getFieldValidations(nodeValidation))[0]
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

      v.errors[0].params.nodeDefName = NodeDef.getLabel(nodeDef, i18n.lang)
      return `${showKeys ? `${i18n.t(k)}: ` : ''}${getValidationFieldErrorMessage(i18n, k)(v)}`
    } else {
      return `${showKeys ? `${i18n.t(field)}: ` : ''}${getValidationFieldErrorMessage(i18n, field)(fieldValidation)}`
    }
  }),
  messages => R.pipe(
    getValidationErrorMessages(i18n),
    R.concat(messages)
  )(validation)
)(validation)

const getValidationFieldMessagesHTML = (i18n, showKeys = true, survey) =>
  validation =>
    R.pipe(
      getValidationFieldMessages(i18n, showKeys, survey),
      R.addIndex(R.map)(
        (msg, i) => <Markdown key={i} source={msg}/>
      )
    )(validation)


const ValidationFieldMessagesHTMLComponent = ({ validation, showKeys, survey }) => {
  const i18n = useI18n()

  return <>{getValidationFieldMessagesHTML(i18n, showKeys, survey)(validation)}</>
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)

  return {
    survey,
  }
}

export default connect(mapStateToProps)(ValidationFieldMessagesHTMLComponent)
