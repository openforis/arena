import * as pgPromise from 'pg-promise'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Category from '../../../../../core/survey/category'
import * as CategoryLevel from '../../../../../core/survey/categoryLevel'
import * as CategoryItem from '../../../../../core/survey/categoryItem'

import * as SQL from '../../../../../common/model/db/sql'
import * as Schemata from '../../../../../common/model/db/schemata'
import { ColumnNodeDef, ViewColumnNodeDef, ViewDataNodeDef } from '../../../../../common/model/db'

const _getSelectFieldNodeDefs = (viewDataNodeDef) =>
  viewDataNodeDef.columnNodeDefs.flatMap((viewColumnNodeDef) => {
    const { nodeDef } = viewColumnNodeDef

    if (NodeDef.isEqual(nodeDef)(viewDataNodeDef.nodeDef) && !NodeDef.isMultipleAttribute(nodeDef)) {
      return [`${viewDataNodeDef.tableData.columnUuid} AS ${viewColumnNodeDef.name}`]
    }
    return viewColumnNodeDef instanceof ViewColumnNodeDef
      ? // column of the view
        viewColumnNodeDef.namesForCreationFull
      : // column coming from data table
        viewColumnNodeDef.namesFull
  })

const _getSelectFieldKeys = (viewDataNodeDef) => {
  const keys = Survey.getNodeDefKeys(viewDataNodeDef.nodeDef)(viewDataNodeDef.survey)
    .map((nodeDef) => {
      const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDef)
      return [`'${NodeDef.getUuid(nodeDef)}'`, `${viewDataNodeDef.tableData.alias}.${columnNodeDef.name}`]
    })
    .flat()
  return `${SQL.jsonBuildObject(...keys)} AS ${ViewDataNodeDef.columnSet.keys}`
}

const _getCategoryItemTableAlias = ({ codeDef }) => `_${NodeDef.getName(codeDef)}_cat_itm`

const _extractCategoryItemTableJoins = ({ viewDataNodeDef }) => {
  const { survey, nodeDef, tableData } = viewDataNodeDef
  const surveySchema = Schemata.getSchemaSurvey(Survey.getId(survey))

  return Survey.getNodeDefChildren(nodeDef)(survey)
    .filter(NodeDef.isCode)
    .map((codeDef) => {
      const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(codeDef)(survey)
      const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(codeDef))(survey)
      const categoryLevel = Category.getLevelByIndex(categoryLevelIndex)(category)
      const categoryLevelUuid = CategoryLevel.getUuid(categoryLevel)
      const categoryItemTableAlias = _getCategoryItemTableAlias({ codeDef })

      return `LEFT JOIN ${surveySchema}.category_item ${categoryItemTableAlias} ON (
          ${categoryItemTableAlias}.level_uuid = '${categoryLevelUuid}'::uuid
          AND ${categoryItemTableAlias}.props ->> '${CategoryItem.keysProps.code}' = ${
        tableData.alias
      }.${NodeDef.getName(codeDef)})`
    })
}

const _getSelectFieldsCategoryItemLabels = ({ survey, nodeDef }) => {
  const langs = Survey.getLanguages(Survey.getSurveyInfo(survey))
  return Survey.getNodeDefChildren(nodeDef)(survey)
    .filter(NodeDef.isCode)
    .flatMap((codeDef) => {
      const categoryItemTableAlias = _getCategoryItemTableAlias({ codeDef })

      return langs.map((lang) => {
        const fieldAlias = `${NodeDef.getName(codeDef)}_label_${lang}`
        return `${categoryItemTableAlias}.props #>> '{${CategoryItem.keysProps.labels},${lang}}' AS ${fieldAlias}`
      })
    })
}

/**
 * Create a nodeDef data view.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {NodeDef} params.nodeDef - The nodeDef to create the data view for.
 * @param {pgPromise.IDatabase} client - The data base client.
 *
 * @returns {Promise<null|*>} - The result promise.
 */
export const createDataView = async ({ survey, nodeDef }, client) => {
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
  const { tableData, viewDataParent } = viewDataNodeDef

  // TODO - do not use select * from virtual entities, it includes parent_uuid column (see https://github.com/openforis/arena/issues/728)
  const selectFields = viewDataNodeDef.virtual
    ? ['*']
    : [
        `${tableData.columnId} AS ${viewDataNodeDef.columnIdName}`,
        tableData.columnRecordUuid,
        tableData.columnRecordCycle,
        tableData.columnDateCreated,
        tableData.columnDateModified,
        _getSelectFieldKeys(viewDataNodeDef),
        ..._getSelectFieldNodeDefs(viewDataNodeDef),
        ..._getSelectFieldsCategoryItemLabels({ survey, nodeDef }),
      ]

  const query = `
    CREATE VIEW ${viewDataNodeDef.nameQualified} AS ( 
      SELECT 
        ${selectFields.join(', ')}
      FROM 
        ${tableData.nameAliased}
      ${
        viewDataNodeDef.virtual || viewDataNodeDef.root
          ? ''
          : `LEFT JOIN ${viewDataParent.nameAliased}  
            ON ${viewDataParent.columnUuid} = ${tableData.columnParentUuid}`
      }
      ${
        /* for every code attribute, join category item table to get item labels in different languages */
        _extractCategoryItemTableJoins({ viewDataNodeDef }).join('\n')
      }

      ${viewDataNodeDef.virtualExpression ? `WHERE ${viewDataNodeDef.virtualExpression}` : ''}
     )`

  console.log('----query', query)

  return client.query(query)
}
