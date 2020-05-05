import Table from '../table'
import TableSurvey from '../tableSurvey'

const columnSet = {
  id: Table.columnSetCommon.id,
  uuid: Table.columnSetCommon.uuid,
  taxonomyUuid: 'taxonomy_uuid',
  props: Table.columnSetCommon.props,
  propsDraft: Table.columnSetCommon.propsDraft,
}

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableTaxon
 */
export default class TableTaxon extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'taxon', columnSet)
  }

  get columnTaxonomyUuid() {
    return super.getColumn(columnSet.taxonomyUuid)
  }
}

TableTaxon.columnSet = columnSet
