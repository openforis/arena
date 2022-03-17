import * as RecordUpdater from './recordUpdater'

export default class RecordUpdateResult {
  constructor({ record = {}, nodes = {} } = { record: null, nodes: {} }) {
    this._record = record
    this._nodes = nodes
  }

  get record() {
    return this._record
  }

  set record(record) {
    this._record = record
  }

  get nodes() {
    return this._nodes
  }

  getNodeByUuid(uuid) {
    return this._nodes[uuid]
  }

  addNode(node) {
    this._nodes[node.uuid] = node
    this._record = RecordUpdater.assocNode(node)(this._record)
  }

  merge(updateResult) {
    this._record = updateResult.record
    Object.assign(this._nodes, updateResult.nodes)
  }
}
