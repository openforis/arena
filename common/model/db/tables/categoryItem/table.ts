import Table from '../table'
import TableSurvey from '../tableSurvey'

const columnSet = {
  id: Table.columnSetCommon.id,
  uuid: Table.columnSetCommon.uuid,
  levelUuid: 'level_uuid',
  parentUuid: 'parent_uuid',
  props: Table.columnSetCommon.props,
  propsDraft: Table.columnSetCommon.propsDraft,
}

export default class TableCategoryItem extends TableSurvey {
  static readonly columnSet = columnSet

  constructor(surveyId: number) {
    super(surveyId, 'category_item', columnSet)
  }

  get columnLevelUuid(): string {
    return super.getColumn(columnSet.levelUuid)
  }

  get columnParentUuid(): string {
    return super.getColumn(columnSet.parentUuid)
  }
}
