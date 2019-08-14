import React, { useState, useEffect } from 'react'
import * as R from 'ramda'

import Validator from '../../../common/validation/validator'

export default (obj, validatorFn, validationEnabled = false) => {
  const [state, setState] = useState({
    validation: {},
    validationEnabled,
    obj,
  })

  useEffect(() => {
    (async () => {
      const validation = await validatorFn(state.obj)
      setState(statePrev => ({
        ...statePrev, validation
      }))
    })()
  }, [state.obj])

  const setObjectField = (field, value) => {
    setState(statePrev => ({
      ...statePrev, obj: R.assoc(field, value, statePrev.obj)
    }))
  }

  const getFieldValidation = field => state.validationEnabled
    ? Validator.getFieldValidation(field)(state.validation)
    : null

  const setValidationEnabled = enabled => {
    setState(statePrev => ({
      ...statePrev, validationEnabled: enabled
    }))
  }

  return {
    object: state.obj,
    objectValid: Validator.isValidationValid(state.validation),
    setObjectField,
    setValidationEnabled,
    getFieldValidation,
  }

}