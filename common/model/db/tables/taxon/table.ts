import Table from '../table'
import TableSurvey from '../tableSurvey'

const columnSet = {
  id: Table.columnSetCommon.id,
  uuid: Table.columnSetCommon.uuid,
  taxonomyUuid: 'taxonomy_uuid',
  props: Table.columnSetCommon.props,
  propsDraft: Table.columnSetCommon.propsDraft,
}

export default class TableTaxon extends TableSurvey {
  static readonly columnSet = columnSet

  constructor(surveyId: number) {
    super(surveyId, 'taxon', columnSet)
  }

  get columnTaxonomyUuid(): string {
    return super.getColumn(columnSet.taxonomyUuid)
  }
}
