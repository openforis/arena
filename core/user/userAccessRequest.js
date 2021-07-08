import * as ObjectUtils from '@core/objectUtils'
import { normalizeName } from '@core/stringUtils'

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
  surveyName: 'surveyName',
  template: 'template',
}

export const editableFields = [
  { name: keys.email, required: true },
  { name: `props.${keysProps.firstName}`, required: true },
  { name: `props.${keysProps.lastName}`, required: true },
  { name: `props.${keysProps.institution}` },
  { name: `props.${keysProps.country}` },
  { name: `props.${keysProps.purpose}`, required: true },
  { name: `props.${keysProps.surveyName}`, required: true, normalizeFn: normalizeName },
  // {
  //   name: `props.${keysProps.template}`,
  //   required: true,
  //   items: ['none', 'templateA', 'templateB'],
  //   defaultValue: 'none',
  // },
]
