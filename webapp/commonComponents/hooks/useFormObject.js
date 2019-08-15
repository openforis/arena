import React, { useState, useEffect } from 'react'
import * as R from 'ramda'

import Validator from '../../../common/validation/validator'

export default (obj, validatorFn = null, validationObj = {}) => {
  const [state, setState] = useState({
    validation: {},
    validationEnabled: false,
    obj,
  })

  // validation effect
  useEffect(() => {
    if (validatorFn) {
      (async () => {
        const validation = await validatorFn(state.obj)
        setState(statePrev => ({
          ...statePrev, validation
        }))
      })()
    } else if (validationObj) {
      setState(statePrev => ({
        ...statePrev, validation: validationObj
      }))
    }
  }, [state.obj])

  const setObjectField = (field, value) => {
    setState(statePrev => ({
      ...statePrev, obj: R.assoc(field, value, statePrev.obj)
    }))
  }

  const getFieldValidation = field => state.validationEnabled
    ? Validator.getFieldValidation(field)(state.validation)
    : null

  const enableValidation = () => {
    setState(statePrev => ({
      ...statePrev, validationEnabled: true
    }))
  }

  return {
    object: state.obj,
    objectValid: Validator.isValidationValid(state.validation),
    setObjectField,
    enableValidation,
    getFieldValidation,
  }

}