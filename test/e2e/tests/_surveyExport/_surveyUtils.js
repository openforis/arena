import * as A from '@core/arena'

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

const isRoot = (nodeDef) => A.isNil(nodeDef.parentUuid)

export const getNodeDefsArray = (survey) => Object.values(survey.nodeDefs)

export const getNodeDefRoot = A.pipe(getNodeDefsArray, A.find(isRoot))

export const getNodeDefByUuid = (uuid) => A.pipe(A.propOr({}, 'nodeDefs'), A.propOr(null, uuid))

export const getNodeDefByName = (name) =>
  A.pipe(
    getNodeDefsArray,
    A.find((nodeDef) => getProps(nodeDef).name === name)
  )

export const getNodeDefSource = (nodeDef) => (nodeDef.virtual ? getNodeDefByUuid(nodeDef.parentUuid) : null)

export const getNodeDefChildren = (nodeDef) => (survey) => {
  const children = []
  if (nodeDef.virtual) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource(nodeDef)(survey)
    children.push(...getNodeDefChildren(entitySource)(survey))
  }

  const { uuid: nodeDefUuid } = nodeDef
  children.push(
    ...A.pipe(
      getNodeDefsArray,
      A.filter((nodeDefCurrent) => {
        if (nodeDefCurrent.analysis) {
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
