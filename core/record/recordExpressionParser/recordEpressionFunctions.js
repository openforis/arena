import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Expression from '@core/expressionParser/expression'
import * as GeoUtils from '@core/geo/geoUtils'
import * as Point from '@core/geo/point'

export const recordExpressionFunctions = ({ survey, record }) => ({
  [Expression.functionNames.categoryItemProp]: (categoryName, itemPropName, ...codePaths) => {
    const category = Survey.getCategoryByName(categoryName)(survey)
    if (!category) return null

    const categoryItem = Survey.getCategoryItemByHierarchicalCodes({
      categoryUuid: Category.getUuid(category),
      codePaths,
    })(survey)

    if (!categoryItem) return null

    const extraProp = CategoryItem.getExtraProp(itemPropName)(categoryItem)
    return A.isEmpty(extraProp) ? null : extraProp
  },
  [Expression.functionNames.distance]: (coordinateFrom, coordinateTo) => {
    const toPoint = (coordinate) =>
      coordinate && typeof coordinate === 'string' ? Point.parse(coordinate) : coordinate
    const pointFrom = toPoint(coordinateFrom)
    const pointTo = toPoint(coordinateTo)
    return GeoUtils.distance(pointFrom, pointTo)
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
})
