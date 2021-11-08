import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import { normalizeName } from '@core/stringUtils'
import { Countries } from '../Countries'

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
}

export const keysPropsNamesLowercase = Object.values(keysProps).map((prop) => prop.toLowerCase())

export const status = {
  ACCEPTED: 'ACCEPTED',
  CREATED: 'CREATED',
  REJECTED: 'REJECTED',
}

export const editableFields = [
  { name: keys.email, required: true },
  { name: `props.${keysProps.firstName}`, required: true },
  { name: `props.${keysProps.lastName}`, required: true },
  { name: `props.${keysProps.institution}` },
  {
    name: `props.${keysProps.country}`,
    itemsFetchFunction: () => Countries.list(),
    itemKeyExtractor: ({ item }) => item.code,
    itemLabelFunction: ({ item }) => item.name,
  },
  { name: `props.${keysProps.purpose}`, required: true },
  { name: `props.${keysProps.surveyName}`, required: true, normalizeFn: normalizeName },
]

export const getFieldItems = ({ field }) => {
  const { itemsFetchFunction } = field
  return itemsFetchFunction ? itemsFetchFunction() : null
}

export const getFieldItemKey = ({ field, item }) => {
  const { itemKeyExtractor } = field
  return itemKeyExtractor ? itemKeyExtractor({ item }) : item
}

export const getFieldItemLabel = ({ field, item }) => {
  const { itemLabelFunction } = field
  return itemLabelFunction ? itemLabelFunction({ item }) : null
}

export const getEmail = A.prop(keys.email)

export const { getDateCreated } = ObjectUtils
