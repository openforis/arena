import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

const keys = {
  dateCreated: 'dateCreated',
  expression: 'expression',
  name: ObjectUtils.keys.name,
  placeholder: 'placeholder',
  uuid: ObjectUtils.keys.uuid,
} as const

export interface AggregateFunctionItem {
  uuid: string
  dateCreated?: number
  name: string
  expression: string
  placeholder?: boolean
}

const newAggregateFunction = ({
  name = '',
  expression = '',
}: { name?: string; expression?: string } = {}): AggregateFunctionItem => ({
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
