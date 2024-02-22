import { useCallback } from 'react'

import { Objects } from '@openforis/arena-core'

import { State } from '../state'

const multipleValuesSeparatorRegEx = /[\s\n;,]+/

const transformText = ({ state, value }) => {
  const textTransformFunction = State.getTextTransformFunction(state)
  return textTransformFunction?.(value) ?? value
}

const handleMultipleTextsPaste = ({ valueParts, statePrev, selection, onChange }) => {
  const valuesTransformed = valueParts
    .map((valuePart) => transformText({ state: statePrev, value: valuePart }))
    .filter((part) => !Objects.isEmpty(part))

  const valuesToAdd = valuesTransformed
    .filter((part, index) => valuesTransformed.indexOf(part) === index) // remove duplicates
    .filter((part) => !selection.includes(part)) // remove values already in selepart)(statePrev))

  if (valuesToAdd.every((value) => State.isValueValid(value)(statePrev))) {
    onChange([...selection, ...valuesToAdd])
    return State.assocInputFieldValue('')(statePrev)
  } else {
    return statePrev
  }
}

export const useOnInputFieldChange = ({ onChange, setState }) =>
  useCallback(
    ({ selection }) =>
      (value) => {
        setState((statePrev) => {
          const valueParts = value.split(multipleValuesSeparatorRegEx)
          if (valueParts.length > 1) {
            return handleMultipleTextsPaste({ valueParts, statePrev, selection, onChange })
          } else {
            const valueTransformed = transformText({ state: statePrev, value })
            return State.assocInputFieldValue(valueTransformed)(statePrev)
          }
        })
      },
    [onChange, setState]
  )
