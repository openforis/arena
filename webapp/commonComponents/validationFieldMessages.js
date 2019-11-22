import './validationFieldMessages.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as RecordValidations from '@core/record/recordValidation'

import * as SurveyState from '@webapp/survey/surveyState'

import Markdown from '@webapp/commonComponents/markdown'


const getErrorText = i18n => error =>
  ValidationResult.hasMessages(error)
    ? ValidationResult.getMessage(i18n.lang)(error)
    : i18n.t(ValidationResult.getKey(error), ValidationResult.getParams(error))

const getMessages = (fn, type) => i18n => R.pipe(
  fn,
  R.map(getErrorText(i18n)),
  R.join(', '),
  msg => msg ? [type, msg] : []
)

const getValidationErrorMessages = i18n => R.converge(
  R.concat, [
    getMessages(Validation.getWarnings, 'warning')(i18n),
    getMessages(Validation.getErrors, 'error')(i18n)
  ]
)

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
    R.identity
  )
)

const getValidationFieldMessages = (i18n, showKeys = true, survey = {}) => validation => R.pipe(
  Validation.getFieldValidations,
  Object.entries,
  // extract invalid fields error messages
  R.map(([field, fieldValidation]) => {
    let k = field
    let v = fieldValidation

    // if it's a childrenCount validation, extract the actual minCount or maxCount validation
    // and add the nodeDefUuid name as param
    if (field === RecordValidations.keys.childrenCount) {
      const [nodeDefUuid, nodeValidation] = Object.entries(Validation.getFieldValidations(v))[0];
      [k, v] = Object.entries(Validation.getFieldValidations(nodeValidation))[0]
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

      v.errors[0].params.nodeDefName = NodeDef.getLabel(nodeDef, i18n.lang)
    }

    const [type, message] = getValidationFieldErrorMessage(i18n, k)(v)
    return [type, `${showKeys ? `${i18n.t(k)}: ` : ''}${message}`]
  }),
  messages => R.pipe(
    getValidationErrorMessages(i18n),
    x => [x],
    R.concat(messages)
  )(validation)
)(validation)


const getValidationFieldMessagesHTML = (i18n, showKeys = true, survey) =>
  validation =>
    R.pipe(
      getValidationFieldMessages(i18n, showKeys, survey),
      R.addIndex(R.map)(
        ([type, message], i) => <Markdown className={`validation_field_message ${type}`} key={i} source={message}/>
      )
    )(validation)


const ValidationFieldMessages = ({ validation, showKeys, survey }) => {
  const i18n = useI18n()

  return <>{getValidationFieldMessagesHTML(i18n, showKeys, survey)(validation)}</>
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)

  return {
    survey,
  }
}

export default connect(mapStateToProps)(ValidationFieldMessages)
