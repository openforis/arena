import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  surveyUuid: 'surveyUuid',
  props: ObjectUtils.keys.props,
}

export const keysProps = {
  name: 'name',
  labels: ObjectUtils.keysProps.labels,
  qualifiers: 'qualifiers',
}

// ====== CREATE
export const newUserGroup = (): Record<string, unknown> => ({ [keys.props]: {} })

// ====== READ
export const { getUuid, getProps, getLabels, getLabel, isEqual } = ObjectUtils
export const getSurveyUuid = R.propOr(null, keys.surveyUuid)
export const getName = ObjectUtils.getProp<string>(keysProps.name, '')
export const getQualifiers = ObjectUtils.getProp<Array<{ name: string; value: string }>>(keysProps.qualifiers, [])
export const { getValidation } = Validation

// ====== UPDATE
export const assocName = (name: string) => ObjectUtils.setProp(keysProps.name, name)
export const { assocLabels } = ObjectUtils
export const assocQualifiers = (qualifiers: Array<{ name: string; value: string }>) =>
  ObjectUtils.setProp(keysProps.qualifiers, qualifiers)
