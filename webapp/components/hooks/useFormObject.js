import { useEffect, useState } from 'react'

import * as Validation from '@core/validation/validation'

export default (obj, validatorFn = null, validationEnabled = false) => {
  const [state, setState] = useState({
    validation: {},
    validationEnabled,
    obj,
  })

  // Validation effect
  useEffect(() => {
    ;(async () => {
      if (validatorFn) {
        setValidation(await validatorFn(state.obj))
      } else {
        setValidation(Validation.getValidation(obj))
      }
    })()
  }, [state.obj])

  const setObjectFields = (fieldValuePairs) => {
    setState((statePrev) => ({
      ...statePrev,
      obj: { ...statePrev.obj, ...fieldValuePairs },
    }))
  }

  const setObjectField = (field, value) => {
    setObjectFields({ [field]: value })
  }

  const setValidation = (validation) =>
    setState((statePrev) => ({
      ...statePrev,
      validation,
    }))

  const getFieldValidation = (field) =>
    state.validationEnabled ? Validation.getFieldValidation(field)(state.validation) : null

  const enableValidation = () => {
    setState((statePrev) => ({
      ...statePrev,
      validationEnabled: true,
    }))
  }

  return {
    object: state.obj,
    objectValid: Validation.isValid(state.validation),
    setObjectFields,
    setObjectField,
    setValidation,
    enableValidation,
    getFieldValidation,
    validation: state.validation,
  }
}
