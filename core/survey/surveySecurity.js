import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

const keys = {
  dataEditorViewNotOwnedRecordsAllowed: 'dataEditorViewNotOwnedRecordsAllowed',
}

const isDataEditorViewNotOwnedRecordsAllowed = ObjectUtils.isKeyTrue(keys.dataEditorViewNotOwnedRecordsAllowed)

const assocDataEditorViewNotOwnedRecordsAllowed = A.assoc(keys.dataEditorViewNotOwnedRecordsAllowed)

export const SurveySecurity = {
  keys,
  isDataEditorViewNotOwnedRecordsAllowed,
  assocDataEditorViewNotOwnedRecordsAllowed,
}
