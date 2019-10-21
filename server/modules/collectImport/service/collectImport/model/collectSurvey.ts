import * as R from 'ramda';
import { nodeDefType, INodeDef } from '../../../../../../core/survey/nodeDef';

export const keys = {
  attributes: 'attributes',
  elements: 'elements',
  name: 'name',
  type: 'type',
  lang: 'xml:lang',
  text: 'text',
}

export const collectNodeDefTypes = {
  boolean: 'boolean',
  code: 'code',
  coordinate: 'coordinate',
  date: 'date',
  entity: 'entity',
  file: 'file',
  number: 'number',
  range: 'range',
  taxon: 'taxon',
  text: 'text',
  time: 'time'
}

interface INodeDefFieldExtractorReturn {
  type: string;
  field?: string;
}
interface INodeDefFieldExtractor {
  [type: string]: (collectNodeDef?: any) => INodeDefFieldExtractorReturn[];
}
export const nodeDefFieldsExtractorByCollectType: INodeDefFieldExtractor = {
  [collectNodeDefTypes.boolean]: () => [{ type: nodeDefType.boolean }],
  [collectNodeDefTypes.code]: () => [{ type: nodeDefType.code }],
  [collectNodeDefTypes.coordinate]: () => [{ type: nodeDefType.coordinate }],
  [collectNodeDefTypes.date]: () => [{ type: nodeDefType.date }],
  [collectNodeDefTypes.entity]: () => [{ type: nodeDefType.entity }],
  [collectNodeDefTypes.file]: () => [{ type: nodeDefType.file }],
  [collectNodeDefTypes.number]: (collectNodeDef: unknown) => {
    const type = getAttribute('type')(collectNodeDef) === 'real'
      ? nodeDefType.decimal
      : nodeDefType.integer
    return [{ type }]
  },
  [collectNodeDefTypes.range]: (collectNodeDef: unknown) => {
    const type = getAttribute('type')(collectNodeDef) === 'real'
      ? nodeDefType.decimal
      : nodeDefType.integer
    return [
      { type, field: 'from' },
      { type, field: 'to' }
    ]
  },
  [collectNodeDefTypes.taxon]: () => [{ type: nodeDefType.taxon }],
  [collectNodeDefTypes.text]: () => [{ type: nodeDefType.text }],
  [collectNodeDefTypes.time]: () => [{ type: nodeDefType.time }],
}

export const layoutTypes = {
  table: 'table',
}

export const samplingPointDataCodeListNames = ['sampling_design', 'ofc_sampling_design']

export const getNodeDefFieldsByCollectNodeDef = (collectNodeDef: Record<string, string>) => {
  const collectType = getElementName(collectNodeDef)
  const fieldsExtractor = nodeDefFieldsExtractorByCollectType[collectType]
  return fieldsExtractor && fieldsExtractor(collectNodeDef)
}

export const toLabels = (elName: string, defaultLang: any, typesFilter = [], suffix = '') =>
  (xml: any) =>
    R.pipe(
      getElementsByName(elName),
      R.reduce((labelsAcc, labelEl) => {
        const lang = getAttribute(keys.lang, defaultLang)(labelEl)
        const type = getAttribute(keys.type)(labelEl)

        if (!R.has(lang, labelsAcc) && (R.isEmpty(typesFilter) || R.includes(type, typesFilter))) {
          const text = getText(labelEl) + suffix
          return R.assoc(lang, text, labelsAcc)
        } else {
          return labelsAcc
        }
      }, {})
    )(xml)

export const getElements: (x: any) => any[] = R.propOr([], keys.elements)

export const getElementsByName = (name: string) => R.pipe(
  getElements,
  R.filter(el => getElementName(el) === name)
)

export const getElementsByPath = (path: string[] | readonly unknown[]) =>
  (xml: any) =>
    R.reduce((acc, pathPart: any) =>
        R.ifElse(
          R.isNil,
          R.identity,
          R.pipe(
            R.ifElse(
              R.is(Array),
              R.head,
              R.identity
            ),
            getElementsByName(pathPart)
          )
        )(acc)
      , xml, path
    )

export const getElementByName = (name: string) => R.pipe(
  getElementsByName(name),
  R.head
)

export const getNodeDefChildByName = (name: unknown) => R.pipe(
  getElements,
  R.find(el => getNodeDefName(el) === name)
)

export const getElementName: (obj: Record<string, string>) => string = R.prop(keys.name)

export const getText = R.pipe(
  getElements,
  R.find(R.propEq(keys.type, keys.text)),
  R.prop(keys.text)
)

export const getAttributes = R.propOr({}, keys.attributes)

// NB: It was hard to get this to typecheck with R.pipe
export const getAttribute: <T,O>(name: string, defaultValue?: T | null) => (obj: O) => T | null
= (name, defaultValue = null) => obj => R.propOr(defaultValue, name)(getAttributes(obj))

/**
 * Returns the attribute called 'name' of a node def element
 */
const getNodeDefName = getAttribute('name')

// TODO: this seems fishy?
export const getAttributeBoolean = (name: string) => R.pipe(
  getAttribute(name),
  R.equals('true')
)

export const getUiAttribute = (name: any, defaultValue = null) => (collectXmlElement: unknown) =>
  getAttribute(`n1:${name}`)(collectXmlElement) ||
  getAttribute(`ui:${name}`, defaultValue)(collectXmlElement)

export const getNodeDefByPath = (collectNodeDefPath: string) => (collectSurvey: any) => {
  const collectAncestorNodeNames = R.pipe(
    R.split('/'),
    R.reject(R.isEmpty)
  )(collectNodeDefPath)

  let currentCollectNode = getElementByName('schema')(collectSurvey)

  for (const collectAncestorNodeName of collectAncestorNodeNames) {
    const collectChildNodeDef = R.pipe(
      R.propOr([], 'elements'),
      R.find(R.pathEq(['attributes', 'name'], collectAncestorNodeName))
    )(currentCollectNode)

    if (collectChildNodeDef)
      currentCollectNode = collectChildNodeDef
    else {
      return null //node def not found
    }
  }

  return currentCollectNode
}

export const getNodeDefChildren = (collectNodeDef: any) => R.pipe(
  getElements,
  R.filter(_isNodeDefElement)
)(collectNodeDef)

const _isNodeDefElement = R.pipe(
  getElementName,
  name => R.includes(name, R.keys(collectNodeDefTypes))
)

export default {
  layoutTypes,

  samplingPointDataCodeListNames,

  getNodeDefFieldsByCollectNodeDef,

  toLabels,
  getElements,
  getElementsByName,
  getElementByName,
  getElementsByPath,
  getElementName,
  getText,
  getChildElementText: (name: any) => R.pipe(getElementByName(name), getText),
  getAttributes,
  getAttribute,
  getAttributeName: getNodeDefName,
  getAttributeBoolean,
  getUiAttribute,

  getNodeDefRoot: R.pipe(
    getElementsByPath(['schema', 'entity']),
    R.head
  ) as (x: any) => INodeDef,
  getNodeDefByPath,
  getNodeDefChildByName,
  getNodeDefChildren
};
