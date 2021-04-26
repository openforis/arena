import * as R from 'ramda'

export const getProps = (obj) => ({ ...obj.props, ...obj.propsDraft })

export const getLabel = (nodeDef, lang) => {
  const { type, analysis } = nodeDef
  const { name, labels, virtual = false } = getProps(nodeDef)
  const label = labels[lang] || name

  if (virtual) {
    return `${label}${' (V)'}`
  }
  if (analysis && type !== 'entity') {
    return `${label}${' (C)'}`
  }
  return label
}

const isRoot = (nodeDef) => R.isNil(nodeDef.parentUuid)

export const getNodeDefsArray = (survey) => Object.values(survey.nodeDefs)

export const getNodeDefRoot = R.pipe(getNodeDefsArray, R.find(isRoot))

export const getNodeDefByUuid = (uuid) => R.pipe(R.propOr({}, 'nodeDefs'), R.propOr(null, uuid))

export const getNodeDefByName = (name) =>
  R.pipe(
    getNodeDefsArray,
    R.find((nodeDef) => nodeDef.props.name === name)
  )

export const getNodeDefSource = (nodeDef) => (nodeDef.virtual ? getNodeDefByUuid(nodeDef.parentUuid) : null)

export const getNodeDefChildren = (nodeDef, _includeAnalysis = false) => (survey) => {
  const children = []
  if (nodeDef.virtual) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource(nodeDef)(survey)
    children.push(...getNodeDefChildren(entitySource, _includeAnalysis)(survey))
  }

  const { uuid: nodeDefUuid } = nodeDef
  children.push(
    ...R.pipe(
      getNodeDefsArray,
      R.filter((nodeDefCurrent) => {
        if (nodeDefCurrent.analysis && !_includeAnalysis) {
          return false
        }
        if (nodeDefCurrent.virtual) {
          // Include virtual entities having their source as a child of the given entity
          const entitySource = getNodeDefSource(nodeDefCurrent)(survey)
          return entitySource.parentUuid === nodeDefUuid
        }
        // "natural" child
        return nodeDefCurrent.parentUuid === nodeDefUuid
      })
    )(survey)
  )
  return children
}
