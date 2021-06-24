import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'

const keys = {
  dateCreated: 'dateCreated',
  expression: 'expression',
  name: ObjectUtils.keys.name,
  placeholder: 'placeholder',
  uuid: ObjectUtils.keys.uuid,
}

const newAggregateFunction = ({ name = '', expression = '' } = {}) => ({
  uuid: uuidv4(),
  dateCreated: Date.now(),
  name,
  expression,
  placeholder: true,
})

export const AggregateFunction = {
  keys,
  newAggregateFunction,
}
