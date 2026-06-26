import { Objects } from '@openforis/arena-core'

import { useState, useEffect, useMemo, useCallback } from 'react'

import * as Validation from '@core/validation/validation'

export default (obj, validatorFn = null, validationEnabled = false) => {
  const [state, setState] = useState({
    validation: {},
    validationEnabled,
    obj,
  })

  const { obj: object, validation } = state

  const initialValidation = useMemo(() => Validation.getValidation(obj), [obj])

  const objectValid = Validation.isValid(validation)

  const setValidation = useCallback(
    (validationNext) =>
      setState((statePrev) =>
        Objects.isEqual(statePrev.validation, validationNext) ? statePrev : { ...statePrev, validation: validationNext }
      ),
    []
  )

  // Validation effect
  useEffect(() => {
    ;(async () => {
      const validationNext = validatorFn ? await validatorFn(object) : initialValidation
      setValidation(validationNext)
    })()
  }, [initialValidation, object, validatorFn, setValidation])

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
