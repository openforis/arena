import Table from '@server/db/table'

const columnSet = {
  uuid: 'uuid',
  chainUuid: 'processing_chain_uuid',
  index: 'index',
  props: 'props',
}

class TableStep extends Table {
  constructor() {
    super('processing_step', columnSet)
  }
}

export default new TableStep()
