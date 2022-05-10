import { Points } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Expression from '@core/expressionParser/expression'

export const recordExpressionFunctions = ({ survey, record }) => ({
  [Expression.functionNames.categoryItemProp]: (categoryName, itemPropName, ...codesPath) => {
    const category = Survey.getCategoryByName(categoryName)(survey)
    if (!category) return null

    const categoryItem = Survey.getCategoryItemByHierarchicalCodes({
      categoryUuid: Category.getUuid(category),
      codesPath,
    })(survey)
    
    if (!categoryItem) return null

    const extraProp = CategoryItem.getExtraProp(itemPropName)(categoryItem)
    return A.isEmpty(extraProp) ? null : extraProp
  },
  [Expression.functionNames.distance]: (coordinateFrom, coordinateTo) => {
    const toPoint = (coordinate) =>
      coordinate && typeof coordinate === 'string' ? Points.parse(coordinate) : coordinate
    const pointFrom = toPoint(coordinateFrom)
    const pointTo = toPoint(coordinateTo)
    if (pointFrom === null || pointTo === null) return null
    return Points.distance(pointFrom, pointTo)
  },
  [Expression.functionNames.index]: (node) => {
    if (!node) {
      return -1
    }
    if (Node.isRoot(node)) {
      return 0
    }
    const nodeParent = Record.getParentNode(node)(record)
    if (!nodeParent) {
      return -1
    }
    const children = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)
    return children.findIndex(Node.isEqual(node))
  },
  [Expression.functionNames.parent]: (node) => {
    if (!node || Node.isRoot(node)) {
      return null
    }
    return Record.getParentNode(node)(record)
  },
  [Expression.functionNames.taxonProp]: (taxonomyName, propName, taxonCode) => {
    const taxonomy = Survey.getTaxonomyByName(taxonomyName)(survey)
    if (!taxonomy) return null

    const taxon = Survey.getTaxonByCode({ taxonomyUuid: Taxonomy.getUuid(taxonomy), taxonCode })(survey)
    if (!taxon) return null

    const value = [
      Taxon.propKeys.code,
      Taxon.propKeys.family,
      Taxon.propKeys.genus,
      Taxon.propKeys.scientificName,
    ].includes(propName)
      ? Taxon.getProps(taxon)[propName]
      : Taxon.getExtraProp(propName)(taxon)

    return A.isEmpty(value) ? null : value
  },
})
