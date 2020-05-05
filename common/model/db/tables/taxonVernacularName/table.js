import Table from '../table'
import TableSurvey from '../tableSurvey'

const columnSet = {
  id: Table.columnSetCommon.id,
  uuid: Table.columnSetCommon.uuid,
  taxonUuid: 'taxon_uuid',
  props: Table.columnSetCommon.props,
  propsDraft: Table.columnSetCommon.propsDraft,
}

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableNode
 */
export default class TableTaxonVernacularName extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'taxon_vernacular_name', columnSet)
  }

  get columnTaxonUuid() {
    return super.getColumn(columnSet.taxonUuid)
  }
}

TableTaxonVernacularName.columnSet = columnSet
