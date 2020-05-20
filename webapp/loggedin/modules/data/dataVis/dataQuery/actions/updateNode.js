import { hideAppSaving } from '@webapp/app/actions'

export const dataQueryTableDataValidationUpdate = 'dataQuery/table/data/validation/update'

export const nodesUpdateCompleted = () => (dispatch) => dispatch(hideAppSaving())

export const nodeValidationsUpdate = ({ recordUuid, validations }) => ({
  type: dataQueryTableDataValidationUpdate,
  recordUuid,
  validations,
})
