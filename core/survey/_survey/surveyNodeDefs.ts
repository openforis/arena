import * as R from 'ramda';
import SurveyCategories from './surveyCategories';
import NodeDef, {INodeDef} from './../nodeDef';
import Category from '../category';
import {Maybe} from '../../../common/types'

const nodeDefsKey = 'nodeDefs'

export interface INodeDefs {
  nodeDefs: { [uuid: string]: INodeDef };
}

// ====== READ
const getNodeDefs: (x: INodeDefs) => INodeDef = R.propOr({}, nodeDefsKey)

const getNodeDefsArray: (x: INodeDefs) => any[] = R.pipe(getNodeDefs, R.values)

const getNodeDefRoot: (survey: INodeDefs) => INodeDef = R.pipe(getNodeDefsArray, R.find(R.propEq(NodeDef.keys.parentUuid, null)))

// TODO: is this really _by_ UUID or just getting the uuid from the nodedef(s)?
const getNodeDefByUuid: (uuid: string) => (survey: INodeDefs) => Maybe<INodeDef>
// @ts-ignore TODO fix this
= uuid => R.pipe(getNodeDefs, R.propOr(null, uuid))

const getNodeDefsByUuids: (uuids?: string[]) => (obj: INodeDefs) => INodeDef[] = (uuids = []) => R.pipe(
  getNodeDefsArray,
  R.filter(nodeDef => R.includes(NodeDef.getUuid(nodeDef), uuids))
)

const getNodeDefChildren: (nodeDef: INodeDef, includeAnalysis?: boolean) => (obj: any) => INodeDef[]
= (nodeDef, includeAnalysis = false) => R.pipe(
  getNodeDefsArray,
  R.filter(nodeDefCurrent =>
    R.propEq(NodeDef.keys.parentUuid, NodeDef.getUuid(nodeDef), nodeDefCurrent) &&
    (includeAnalysis || !NodeDef.isAnalysis(nodeDefCurrent))
  ),
)

const hasNodeDefChildrenEntities = (nodeDef: INodeDef) => (survey: INodeDefs) => {
  if (NodeDef.isAttribute(nodeDef))
    return false

  return R.pipe(
    getNodeDefChildren(nodeDef),
    R.any(NodeDef.isEntity),
  )(survey)

}

const getNodeDefChildByName = (nodeDef: INodeDef, childName: any) =>
  R.pipe(
    getNodeDefChildren(nodeDef),
    R.find(childDef => childName === NodeDef.getName(childDef))
  )

const getNodeDefSiblingByName = (nodeDef: INodeDef, name: any) => (survey: INodeDefs) => {
  const parentDef = getNodeDefParent(nodeDef)(survey) as INodeDef // TODO: handle null
  return getNodeDefChildByName(parentDef, name)(survey)
}

const getNodeDefKeys: (nodeDef: INodeDef) => (x: any) => INodeDef[] = nodeDef => R.pipe(
  getNodeDefChildren(nodeDef),
  R.filter((n: INodeDef) => NodeDef.isKey(n)),
)

const isNodeDefRootKey = (nodeDef: INodeDef) => (survey: INodeDefs) =>
  NodeDef.isKey(nodeDef) &&
  NodeDef.isRoot(getNodeDefParent(nodeDef)(survey))

const getNodeDefByName = (name: any) => R.pipe(
  getNodeDefsArray,
  R.find(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.name], name))
)

const getNodeDefsByCategoryUuid: (uuid: any) => (x: any) => INodeDef[] = (uuid: any) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.categoryUuid], uuid))
)

const getNodeDefsByTaxonomyUuid: (uuid: any) => (x: any) => INodeDef[] = (uuid: any) => R.pipe(
  getNodeDefsArray,
  R.filter(R.pathEq([NodeDef.keys.props, NodeDef.propKeys.taxonomyUuid], uuid))
)

const findNodeDef = (predicate: (a: INodeDef) => boolean) => R.pipe(
  getNodeDefsArray,
  R.find(predicate)
)

// ====== UPDATE

const assocNodeDefs = (nodeDefs: any) => R.assoc(nodeDefsKey, nodeDefs)

// ====== HIERARCHY

const getNodeDefParent: (nodeDef: INodeDef) => (survey: INodeDefs) => Maybe<INodeDef>
= nodeDef => getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))

const visitAncestorsAndSelf = (nodeDef: INodeDef, visitorFn: { (nodeDefAncestor: any): void; (arg0: any): void; }) => (survey: INodeDefs) => {
  let nodeDefCurrent: INodeDef | null = nodeDef
  do {
    visitorFn(nodeDefCurrent)
    nodeDefCurrent = getNodeDefParent(nodeDefCurrent)(survey)
  } while (nodeDefCurrent)
}

const isNodeDefAncestor = (nodeDefAncestor: any, nodeDefDescendant: INodeDef) =>
  (  survey: INodeDefs) => {
    if (NodeDef.isRoot(nodeDefDescendant))
      return false

    const nodeDefParent = getNodeDefParent(nodeDefDescendant)(survey)
    return NodeDef.getUuid(nodeDefParent) === NodeDef.getUuid(nodeDefAncestor)
      ? true
      : isNodeDefAncestor(nodeDefAncestor, nodeDefParent)(survey)
  }

const getHierarchy = (filterFn = NodeDef.isEntity, includeAnalysis = false) =>
  (  survey: INodeDefs) => {

    let length = 1
    const h = (array: readonly any[] | never[], nodeDef: INodeDef) => {
      const childDefs = NodeDef.isEntity(nodeDef)
        ? R.pipe(getNodeDefChildren(nodeDef, includeAnalysis), R.filter(filterFn))(survey)
        : []

      length += childDefs.length
      const item = { ...nodeDef, children: R.reduce(h, [], childDefs) }
      return R.append(item, array)
    }

    return {
      root: h([], getNodeDefRoot(survey))[0],
      length
    }

  }

const traverseHierarchyItem = async (nodeDefItem: any, visitorFn: (arg0: any, arg1: number) => void, depth = 0) => {
  await visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem) as any[]
  for (const child of children) {
    await traverseHierarchyItem(child, visitorFn, depth + 1)
  }
}

const traverseHierarchyItemSync = (nodeDefItem: any, visitorFn: (arg0: any, arg1: number) => void, depth = 0) => {
  visitorFn(nodeDefItem, depth)
  const children = R.propOr([], 'children', nodeDefItem) as any[]
  for (const child of children) {
    traverseHierarchyItemSync(child, visitorFn, depth + 1)
  }
}

// ====== NODE DEFS CODE UTILS
const getNodeDefParentCode = (nodeDef: INodeDef) => getNodeDefByUuid(NodeDef.getParentCodeDefUuid(nodeDef))

const isNodeDefParentCode = (nodeDef: INodeDef) => (survey: INodeDefs) => R.pipe(
  getNodeDefsArray,
  R.any(def => NodeDef.getParentCodeDefUuid(def) === NodeDef.getUuid(nodeDef)),
)

const getNodeDefCodeCandidateParents = (nodeDef: INodeDef) => (survey: INodeDefs) => {
  const category = SurveyCategories.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)

  if (category) {
    const levelsLength = Category.getLevelsArray(category).length

    const candidates: INodeDef[] = []
    visitAncestorsAndSelf(
      nodeDef,
      (      nodeDefAncestor: INodeDef) => {
        if (!NodeDef.isEqual(nodeDefAncestor)(nodeDef)) {

          const candidatesAncestor = R.pipe(
            getNodeDefChildren(nodeDefAncestor),
            R.reject((n: INodeDef) =>
              // reject multiple attributes
              NodeDef.isMultiple(n) ||
              // or different category nodeDef
              NodeDef.getCategoryUuid(n) !== Category.getUuid(category) ||
              // or itself
              NodeDef.getUuid(n) === NodeDef.getUuid(nodeDef) ||
              // or leaves nodeDef
              getNodeDefCategoryLevelIndex(n)(survey) === levelsLength - 1
            )
          )(survey)

          candidates.push(...candidatesAncestor)
        }
      }
    )(survey)
    return candidates
  } else {
    return []
  }
}

const getNodeDefCategoryLevelIndex: (nodeDef: INodeDef) => (survey: INodeDefs) => any
= (nodeDef: INodeDef) => (survey: INodeDefs) => {
    const parentCodeNodeDef = getNodeDefParentCode(nodeDef)(survey)
    return parentCodeNodeDef
      ? 1 + getNodeDefCategoryLevelIndex(parentCodeNodeDef)(survey)
      : 0
  }

const canUpdateCategory = (nodeDef: INodeDef) =>
  (survey: INodeDefs) =>
    !(NodeDef.isPublished(nodeDef) || isNodeDefParentCode(nodeDef)(survey))

const canUpdateTaxonomy = (nodeDef: INodeDef) => (x: any) => !NodeDef.isPublished(nodeDef)

export default {
  // ====== READ
  getNodeDefs,
  getNodeDefsArray,

  getNodeDefRoot,
  getNodeDefByUuid,
  getNodeDefsByUuids,
  getNodeDefChildren,
  hasNodeDefChildrenEntities,
  getNodeDefChildByName,
  getNodeDefSiblingByName,
  getNodeDefKeys,
  isNodeDefRootKey,
  getNodeDefByName,

  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,

  findNodeDef,

  // ====== UPDATE
  assocNodeDefs,

  // ====== HIERARCHY
  getNodeDefParent,
  visitAncestorsAndSelf,
  getHierarchy,
  isNodeDefAncestor,
  traverseHierarchyItem,
  traverseHierarchyItemSync,

  // ====== NodeDef Code
  getNodeDefCategoryLevelIndex,
  getNodeDefParentCode,
  getNodeDefCodeCandidateParents,
  isNodeDefParentCode,
  canUpdateCategory,

  // ====== NodeDef Taxonomy
  canUpdateTaxonomy,
};
