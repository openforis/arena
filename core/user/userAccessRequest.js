import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  email: 'email',
  props: ObjectUtils.keys.props,
}

export const keysProps = {
  firstName: 'firstName',
  lastName: 'lastName',
  country: 'country',
  institution: 'institution',
  purpose: 'purpose',
}

export const editableFields = [
  { name: keys.email, required: true },
  { name: `props.${keysProps.firstName}`, required: true },
  { name: `props.${keysProps.lastName}`, required: true },
  { name: `props.${keysProps.institution}` },
  { name: `props.${keysProps.country}` },
  { name: `props.${keysProps.purpose}` },
]
