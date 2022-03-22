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
    return this
  }

  /**
   * Merges this record update result with the specified one.
   * The record of this record update result will be the one of the specified record update result
   * and the nodes of the specified one will be added to the nodes of this one.
   *
   * @param {!RecordUpdateResult} recordUpdateResult - The record update result to merge with.
   * @returns {RecordUpdateResult} - The updated object.
   */
  merge(recordUpdateResult) {
    this._record = recordUpdateResult.record
    Object.assign(this._nodes, recordUpdateResult.nodes)
    return this
  }
}
