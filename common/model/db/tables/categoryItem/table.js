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

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableCategoryItem
 */
export default class TableCategoryItem extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, 'category_item', columnSet)
  }

  get columnLevelUuid() {
    return super.getColumn(columnSet.levelUuid)
  }

  get columnParentUuid() {
    return super.getColumn(columnSet.parentUuid)
  }
}

TableCategoryItem.columnSet = columnSet
