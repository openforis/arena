import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: 'uuid',
  chainUuid: 'processing_chain_uuid',
  index: 'index',
  props: 'props',
}
/**
 * @typedef {module:arena.TableSurvey} module:arena.TableStep
 */
export default class TableStep extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'processing_step', columnSet)
    this.getSelect = getSelect.bind(this)
  }

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
  }

  get columnChainUuid() {
    return this.getColumn(columnSet.chainUuid)
  }

  get columnIndex() {
    return this.getColumn(columnSet.index)
  }
}
