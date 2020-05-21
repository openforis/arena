import * as R from 'ramda'

import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'

import { keys, rowKeys, tableKeys } from './keys'

const _updateData = (updateFn) => (state) =>
  R.pipe(R.pathOr([], [keys.table, tableKeys.data]), updateFn, (dataUpdated) =>
    R.assocPath([keys.table, tableKeys.data], dataUpdated, state)
  )(state)

export const assocTableDataRecordNodes = (nodes) =>
  // Replace nodes in table rows
  _updateData((data) =>
    Object.values(nodes).reduce(
      (accData, node) =>
        accData.map((row) => {
          const nodeDefUuid = Node.getNodeDefUuid(node)
          const rowUpdated = { ...row }
          const { record } = rowUpdated
          if (Record.getUuid(record) === Node.getRecordUuid(node)) {
            const cell = rowUpdated.cols[nodeDefUuid]

            if (cell && Node.isEqual(node)(cell.node)) {
              rowUpdated.cols[nodeDefUuid] = R.ifElse(
                R.always(Node.isDeleted(node)),
                R.dissoc('node'),
                R.assoc('node', node)
              )(cell)
            }
          }
          return rowUpdated
        }),
      data
    )
  )

export const assocTableDataRecordNodeValidations = (recordUuid, validations) =>
  _updateData(
    R.map((row) => {
      if (R.pathEq([rowKeys.record, Record.keys.uuid], recordUuid)(row)) {
        const record = row[rowKeys.record]
        const recordValidation = Validation.getValidation(record)
        const recordValidationUpdated = Validation.mergeValidation(validations)(recordValidation)
        return R.assocPath([rowKeys.record, Validation.keys.validation], recordValidationUpdated)(row)
      }
      return row
    })
  )
