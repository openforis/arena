export const textTransformValues = {
  none: 'none',
  capitalize: 'capitalize',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
}

const upperCase = (s) => {
  if (typeof s !== 'string') return s
  return s.toUpperCase()
}

const lowerCase = (s) => {
  if (typeof s !== 'string') return s
  return s.toLowerCase()
}

const capitalize = (s) => {
  if (typeof s !== 'string') return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const identity = (s) => s

const transformFunctions = {
  [textTransformValues.capitalize]: capitalize,
  [textTransformValues.lowercase]: lowerCase,
  [textTransformValues.uppercase]: upperCase,
  [textTransformValues.none]: identity,
}

export const transform = ({ textTransform }) => {
  const transformFunction = transformFunctions[textTransform]
  return transformFunction || identity
}
