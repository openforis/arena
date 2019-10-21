import React, { useState, useEffect } from 'react'
import * as R from 'ramda'

import Validation from '../../../core/validation/validation'

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
      } else {
        setValidation(Validation.getValidation(obj))
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
    ? Validation.getFieldValidation(field)(state.validation)
    : null

  const enableValidation = () => {
    setState(statePrev => ({
      ...statePrev, validationEnabled: true
    }))
  }

  return {
    object: state.obj,
    objectValid: Validation.isValid(state.validation),
    setObjectField,
    setValidation,
    enableValidation,
    getFieldValidation,
    validation: state.validation,
  }

}
