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

const getMessages = (fn, severity) => i18n =>
  R.pipe(fn, R.map(getErrorText(i18n)), R.join(', '), msg => (msg ? [severity, msg] : []))

const getValidationErrorMessages = i18n =>
  R.converge(R.concat, [
    getMessages(Validation.getWarnings, ValidationResult.severity.warning)(i18n),
    getMessages(Validation.getErrors, ValidationResult.severity.error)(i18n),
  ])

const getValidationFieldErrorMessage = (i18n, field) =>
  R.pipe(
    getValidationErrorMessages(i18n),
    R.ifElse(
      R.isEmpty,
      () =>
        getErrorText(i18n)(
          ValidationResult.newInstance(
            Validation.messageKeys.invalidField, // Default error message
            { field },
          ),
        ),
      R.identity,
    ),
  )

const getChildrenCountValidation = (validation, survey, showKeys, i18n) => {
  return Object.entries(validation).map(([nodeDefUuid, nodeValidation]) => {
    const [field, fieldValidation] = Object.entries(Validation.getFieldValidations(nodeValidation))[0]
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    fieldValidation.errors[0].params.nodeDefName = NodeDef.getLabel(nodeDef, i18n.lang)
    const [severity, message] = getValidationFieldErrorMessage(i18n, field)(fieldValidation)

    return [severity, `${showKeys ? `${i18n.t(field)}: ` : ''}${message}`]
  })
}

const getValidationFieldMessages = (i18n, survey, showKeys = true) => validation => {
  const messages = []

  R.pipe(
    Validation.getFieldValidations,
    Object.entries,
    // Extract invalid fields error messages
    R.forEach(([field, childValidation]) => {
      // If it's a childrenCount validation, extract the actual minCount or maxCount validation
      // and add the nodeDefUuid name as param
      if (field === RecordValidations.keys.childrenCount) {
        const childrenCountValidation = getChildrenCountValidation(
          Validation.getFieldValidations(childValidation),
          survey,
          showKeys,
          i18n,
        )
        messages.push(...childrenCountValidation)
      } else {
        const [severity, message] = getValidationFieldErrorMessage(i18n, field)(childValidation)
        messages.push([severity, `${showKeys ? `${i18n.t(field)}: ` : ''}${message}`])
      }
    }),
  )(validation)

  R.pipe(getValidationErrorMessages(i18n), x => {
    if (x.length > 0) messages.push(x)
  })(validation)

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
