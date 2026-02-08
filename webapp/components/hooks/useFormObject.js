import { useState, useEffect } from 'react'

import * as Validation from '@core/validation/validation'

export default (obj, validatorFn = null, validationEnabled = false) => {
  const [state, setState] = useState({
    validation: {},
    validationEnabled,
    obj,
  })

  const initialValidation = Validation.getValidation(obj)

  const { obj: object, validation } = state

  const objectValid = Validation.isValid(state.validation)

  const setValidation = (validation) =>
    setState((statePrev) => ({
      ...statePrev,
      validation,
    }))

  // Validation effect
  useEffect(() => {
    ;(async () => {
      if (validatorFn) {
        setValidation(await validatorFn(object))
      } else {
        setValidation(initialValidation)
      }
    })()
  }, [initialValidation, object, validatorFn])

  const setObjectFields = (fieldValuePairs) => {
    setState((statePrev) => ({
      ...statePrev,
      obj: { ...statePrev.obj, ...fieldValuePairs },
    }))
  }

  const setObjectField = (field, value) => {
    setObjectFields({ [field]: value })
  }

  const getFieldValidation = (field) =>
    state.validationEnabled ? Validation.getFieldValidation(field)(state.validation) : null

  const enableValidation = () => {
    setState((statePrev) => ({
      ...statePrev,
      validationEnabled: true,
    }))
  }

  return {
    object,
    objectValid,
    setObjectFields,
    setObjectField,
    setValidation,
    enableValidation,
    getFieldValidation,
    validation,
  }
}
