import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

const keys = {
  dataEditorViewNotOwnedRecordsAllowed: 'dataEditorViewNotOwnedRecordsAllowed',
}

const defaults = {
  [keys.dataEditorViewNotOwnedRecordsAllowed]: true,
}

const getDefaults = () => ({ ...defaults })

const isDataEditorViewNotOwnedRecordsAllowed = ObjectUtils.isKeyTrue(keys.dataEditorViewNotOwnedRecordsAllowed)

const assocDataEditorViewNotOwnedRecordsAllowed = A.assoc(keys.dataEditorViewNotOwnedRecordsAllowed)

export const SurveySecurity = {
  keys,
  getDefaults,
  isDataEditorViewNotOwnedRecordsAllowed,
  assocDataEditorViewNotOwnedRecordsAllowed,
}
