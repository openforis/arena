const socketIdsByRecordUuid = new Map()

export const getSocketIds = (recordUuid) => socketIdsByRecordUuid.get(recordUuid) || new Set()

export const hasSockets = (recordUuid) => getSocketIds(recordUuid).size !== 0

export const getRecordUuid = (socketId) => {
  const recordUuids = [...socketIdsByRecordUuid.keys()]
  return recordUuids.find((recordUuid) => getSocketIds(recordUuid).has(socketId))
}

export const assocSocket = (recordUuid, socketId) => {
  if (!socketIdsByRecordUuid.has(recordUuid)) {
    socketIdsByRecordUuid.set(recordUuid, new Set())
  }

  getSocketIds(recordUuid).add(socketId)
}

export const dissocSocket = (recordUuid, socketId) => {
  getSocketIds(recordUuid).delete(socketId)

  if (!hasSockets(recordUuid)) {
    dissocSockets(recordUuid)
  }
}

export const dissocSockets = (recordUuid) => socketIdsByRecordUuid.delete(recordUuid)
