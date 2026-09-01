import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import { normalizeName } from '@core/stringUtils'

export const keys = {
  email: 'email',
  props: ObjectUtils.keys.props,
} as const

export const keysProps = {
  firstName: 'firstName',
  lastName: 'lastName',
  country: 'country',
  institution: 'institution',
  purpose: 'purpose',
  surveyName: 'surveyName',
  templateUuid: 'templateUuid',
} as const

export const keysPropsNamesLowercase = Object.values(keysProps).map((prop) => prop.toLowerCase())

export const status = {
  ACCEPTED: 'ACCEPTED',
  CREATED: 'CREATED',
  REJECTED: 'REJECTED',
} as const

export const editableFields = [
  { name: keys.email, required: true },
  { name: `props.${keysProps.firstName}`, required: true },
  { name: `props.${keysProps.lastName}`, required: true },
  { name: `props.${keysProps.institution}`, required: true },
  { name: `props.${keysProps.country}`, required: true },
  { name: `props.${keysProps.purpose}`, required: true },
  { name: `props.${keysProps.surveyName}`, required: true, normalizeFn: normalizeName },
  { name: `props.${keysProps.templateUuid}`, required: false },
]

export const getEmail = A.prop(keys.email)

export const { getDateCreated } = ObjectUtils
