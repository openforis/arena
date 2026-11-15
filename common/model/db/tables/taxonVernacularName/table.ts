import Table from '../table'
import TableSurvey from '../tableSurvey'

const columnSet = {
  id: Table.columnSetCommon.id,
  uuid: Table.columnSetCommon.uuid,
  taxonUuid: 'taxon_uuid',
  props: Table.columnSetCommon.props,
  propsDraft: Table.columnSetCommon.propsDraft,
}

export default class TableTaxonVernacularName extends TableSurvey {
  static columnSet = columnSet

  constructor(surveyId: number) {
    super(surveyId, 'taxon_vernacular_name', columnSet)
  }

  get columnTaxonUuid(): string {
    return super.getColumn(columnSet.taxonUuid)
  }
}
