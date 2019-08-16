import React, { useState, useEffect } from 'react'
import * as R from 'ramda'

import Validator from '../../../common/validation/validator'

export default (obj, validatorFn = null, validationEnabled = false) => {
  const [state, setState] = useState({
    validation: {},
    validationEnabled,
    obj,
  })

  // validation effect
  useEffect(() => {
    (async () => {
      if (validatorFn) {
        setValidation(await validatorFn(state.obj))
      } else if (Validator.getValidation(obj)) {
        setValidation(Validator.getValidation(obj))
      }
    })()
  }, [state.obj])

  const setObjectField = (field, value) => {
    setState(statePrev => ({
      ...statePrev, obj: R.assoc(field, value, statePrev.obj)
    }))
  }

  const setValidation = validation => setState(statePrev => ({
    ...statePrev,
    validation
  }))

  const getFieldValidation = field => state.validationEnabled
    ? Validator.getFieldValidation(field)(state.validation)
    : null

  const enableValidation = enabled => {
    setState(statePrev => ({
      ...statePrev, validationEnabled: enabled
    }))
  }

  return {
    object: state.obj,
    objectValid: Validator.isValidationValid(state.validation),
    setObjectField,
    setValidation,
    enableValidation,
    getFieldValidation,
  }

}