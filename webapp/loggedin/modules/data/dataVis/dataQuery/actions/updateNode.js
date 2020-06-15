import { AppSavingActions } from '@webapp/store/app'

export const dataQueryTableDataValidationUpdate = 'dataQuery/table/data/validation/update'

export const nodesUpdateCompleted = () => (dispatch) => dispatch(AppSavingActions.hideAppSaving())

export const nodeValidationsUpdate = ({ recordUuid, validations }) => ({
  type: dataQueryTableDataValidationUpdate,
  recordUuid,
  validations,
})
