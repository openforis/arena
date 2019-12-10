import './validationFieldMessages.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as RecordValidation from '@core/record/recordValidation'

import * as SurveyState from '@webapp/survey/surveyState'

import Markdown from '@webapp/commonComponents/markdown'

const getValidationCountErrorText = (survey, i18n) => validationResult => {
  const nodeDef = Survey.getNodeDefByUuid(ValidationResult.getParams(validationResult).nodeDefUuid)(survey)
  const nodeDefName = NodeDef.getLabel(nodeDef, i18n.lang)
  return i18n.t(ValidationResult.getKey(validationResult), {
    ...ValidationResult.getParams(validationResult),
    nodeDefName,
  })
}

const getErrorText = (survey, i18n) => validationResult =>
  ValidationResult.hasMessages(validationResult)
    ? ValidationResult.getMessage(i18n.lang)(validationResult)
    : RecordValidation.isValidationResultErrorCount(validationResult)
    ? getValidationCountErrorText(survey, i18n)(validationResult)
    : i18n.t(ValidationResult.getKey(validationResult), ValidationResult.getParams(validationResult))

const getMessages = (survey, fn, severity) => i18n =>
  R.pipe(fn, R.map(getErrorText(survey, i18n)), R.join(', '), msg => (msg ? [severity, msg] : []))

const getValidationErrorMessages = (survey, i18n) =>
  R.converge(R.concat, [
    getMessages(survey, Validation.getWarnings, ValidationResult.severity.warning)(i18n),
    getMessages(survey, Validation.getErrors, ValidationResult.severity.error)(i18n),
  ])

const getValidationFieldErrorMessage = (survey, field, i18n) =>
  R.pipe(
    getValidationErrorMessages(survey, i18n),
    R.when(R.isEmpty, () =>
      getErrorText(
        survey,
        i18n,
      )(
        ValidationResult.newInstance(
          Validation.messageKeys.invalidField, // Default error message
          { field },
        ),
      ),
    ),
  )

const getValidationFieldMessages = (i18n, survey, showKeys = true) => validation => {
  const messages = [] // Every message is an array with 2 items (severity and message)

  // Add messages from fields
  R.pipe(
    Validation.getFieldValidations,
    Object.entries,
    // Extract invalid fields error messages
    R.forEach(([field, childValidation]) => {
      const [severity, message] = getValidationFieldErrorMessage(survey, field, i18n)(childValidation)
      messages.push([severity, `${showKeys ? `${i18n.t(field)}: ` : ''}${message}`])
    }),
  )(validation)

  // Add messages from validation errors and warnings
  R.pipe(
    getValidationErrorMessages(survey, i18n),
    R.unless(R.isEmpty, message => messages.push(message)),
  )(validation)

  return messages
}

const ValidationFieldMessages = props => {
  const { validation, survey, showKeys, showIcons } = props
  const i18n = useI18n()

  return R.pipe(
    getValidationFieldMessages(i18n, survey, showKeys),
    R.addIndex(R.map)(([type, message], i) => (
      <div className={`validation-field_message ${type}`} key={i}>
        {showIcons && <span className="icon icon-warning icon-12px icon-left" />}
        <Markdown className="validation-field-message__text" source={message} />
      </div>
    )),
  )(validation)
}

ValidationFieldMessages.defaultProps = {
  validation: null,
  survey: null,
  showKeys: true, // Show the key of the fields' validations
  showIcons: false, // Show error or warning icon
}

const mapStateToProps = state => ({
  survey: SurveyState.getSurvey(state),
})

export default connect(mapStateToProps)(ValidationFieldMessages)
