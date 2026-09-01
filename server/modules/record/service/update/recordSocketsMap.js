import { RecordSocketAssociationRepository } from '@openforis/arena-server'

export const assocSocket = (...args) => RecordSocketAssociationRepository.assocSocket(...args)
export const dissocSocket = (...args) => RecordSocketAssociationRepository.dissocSocket(...args)
export const dissocSocketBySocketId = (...args) => RecordSocketAssociationRepository.dissocSocketBySocketId(...args)
export const dissocSocketsByRecordUuid = (...args) =>
  RecordSocketAssociationRepository.dissocSocketsByRecordUuid(...args)
export const getSocketIdsByRecordUuid = (...args) => RecordSocketAssociationRepository.getSocketIdsByRecordUuid(...args)
