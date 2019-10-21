const socketIdsByRecordUuid = new Map()

const getSocketIds = recordUuid => socketIdsByRecordUuid.get(recordUuid) || new Set()

const hasSockets = recordUuid => getSocketIds(recordUuid).size !== 0

const getRecordUuid = socketId => {
  const recordUuids = Array.from(socketIdsByRecordUuid.keys())
  return recordUuids.find(recordUuid => getSocketIds(recordUuid).has(socketId))
}

const assocSocket = (recordUuid, socketId) => {
  if (!socketIdsByRecordUuid.has(recordUuid)) {
    socketIdsByRecordUuid.set(recordUuid, new Set())
  }

  getSocketIds(recordUuid).add(socketId)
}

const dissocSocket = (recordUuid, socketId) => {
  getSocketIds(recordUuid).delete(socketId)

  if (!hasSockets(recordUuid)) {
    dissocSockets(recordUuid)
  }
}

const dissocSockets = recordUuid => socketIdsByRecordUuid.delete(recordUuid)

export default {
  getSocketIds,
  hasSockets,
  getRecordUuid,

  assocSocket,
  dissocSocket,
  dissocSockets,
};
