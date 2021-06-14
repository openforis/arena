import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  index: ObjectUtils.keys.index,
  processingChainUuid: 'processing_chain_uuid',
  props: ObjectUtils.keys.props,
  temporary: ObjectUtils.keys.temporary,
  uuid: ObjectUtils.keys.uuid,
  nodeDefUuid: 'node_def_uuid',
}

export const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', // True|false
}

// ====== READ

export const getProcessingChainUuid = R.prop(keys.processingChainUuid)
export const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
export const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
export const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)

export const { getIndex, getUuid, getProps, getPropsDiff } = ObjectUtils

export const { isEqual, isTemporary } = ObjectUtils

// ===== UTILS

export const hasEntity = R.pipe(getEntityUuid, R.isNil, R.not)
export const hasCategory = R.pipe(getCategoryUuid, R.isNil, R.not)
