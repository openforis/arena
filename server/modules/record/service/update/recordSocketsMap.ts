import { RecordSocketAssociationRepository } from '@openforis/arena-server'

export const assocSocket = (...args: Parameters<typeof RecordSocketAssociationRepository.assocSocket>) =>
  RecordSocketAssociationRepository.assocSocket(...args)
export const dissocSocket = (...args: Parameters<typeof RecordSocketAssociationRepository.dissocSocket>) =>
  RecordSocketAssociationRepository.dissocSocket(...args)
export const dissocSocketBySocketId = (
  ...args: Parameters<typeof RecordSocketAssociationRepository.dissocSocketBySocketId>
) => RecordSocketAssociationRepository.dissocSocketBySocketId(...args)
export const dissocSocketsByRecordUuid = (
  ...args: Parameters<typeof RecordSocketAssociationRepository.dissocSocketsByRecordUuid>
) => RecordSocketAssociationRepository.dissocSocketsByRecordUuid(...args)
export const getSocketIdsByRecordUuid = (
  ...args: Parameters<typeof RecordSocketAssociationRepository.getSocketIdsByRecordUuid>
) => RecordSocketAssociationRepository.getSocketIdsByRecordUuid(...args)
