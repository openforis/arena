const socketIdsByRecordUuid = new Map()

export const getSocketIdsByRecordUuid = (recordUuid) => socketIdsByRecordUuid.get(recordUuid) || new Set()

const hasSocketsByRecordUuid = (recordUuid) => getSocketIdsByRecordUuid(recordUuid).size > 0

const getRecordUuid = (socketId) => {
  const recordUuids = [...socketIdsByRecordUuid.keys()]
  return recordUuids.find((recordUuid) => getSocketIdsByRecordUuid(recordUuid).has(socketId))
}

export const assocSocket = ({ recordUuid, socketId }) => {
  if (!socketIdsByRecordUuid.has(recordUuid)) {
    socketIdsByRecordUuid.set(recordUuid, new Set())
  }

  getSocketIdsByRecordUuid(recordUuid).add(socketId)
}

export const dissocSocket = ({ recordUuid, socketId }) => {
  getSocketIdsByRecordUuid(recordUuid).delete(socketId)

  if (!hasSocketsByRecordUuid(recordUuid)) {
    dissocSocketsByRecordUuid(recordUuid)
  }
}

export const dissocSocketBySocketId = (socketId) => {
  const recordUuid = getRecordUuid(socketId)
  dissocSocket({ recordUuid, socketId })
}

export const dissocSocketsByRecordUuid = (recordUuid) => socketIdsByRecordUuid.delete(recordUuid)
