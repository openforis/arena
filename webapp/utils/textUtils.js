import * as A from '@core/arena'

export const textTransformValues = {
  none: 'none',
  capitalize: 'capitalize',
  lowercase: 'lowercase',
  uppercase: 'uppercase',
}

const identity = (s) => s
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const lowerCase = (s) => s.toLowerCase()
const upperCase = (s) => s.toUpperCase()

const transformFunctions = {
  [textTransformValues.none]: identity,
  [textTransformValues.capitalize]: capitalize,
  [textTransformValues.lowercase]: lowerCase,
  [textTransformValues.uppercase]: upperCase,
}

const applyTransformFn = (fn) => (s) => {
  if (typeof s !== 'string' || A.isEmpty(s)) identity(s)
  return fn(s)
}

export const transform = ({ textTransform }) => {
  const transformFunction = transformFunctions[textTransform]
  return transformFunction ? applyTransformFn(transformFunction) : identity
}
