import * as R from 'ramda'

import * as PromiseUtils from '../../../../core/promiseUtils'
import { getSurveyEntry } from '../../downloads/path'
import { cluster, plot, tree } from '../../mock/nodeDefs'
import { getLabel, getNodeDefChildren, getNodeDefRoot } from './_surveyUtils'

// eslint-disable-next-line camelcase
const { cluster_country, cluster_region, cluster_province } = cluster.children

const verifyNodeDef = async (nodeDefExport, nodeDefMock) => {
  const { props, type, analysis } = nodeDefExport
  const { name, key = false } = props

  await expect(name).toBe(nodeDefMock.name)
  await expect(getLabel(nodeDefExport, 'en')).toBe(nodeDefMock.label)
  await expect(type).toBe(nodeDefMock.type)
  await expect(key).toBe(nodeDefMock.key || false)
  await expect(analysis).toBe(nodeDefMock.analysis || false)
}

export const verifyNodeDefs = (survey) => {
  test(`Verify ${survey.name} nodeDefs`, async () => {
    const surveyExport = getSurveyEntry(survey, 'survey.json')
    const clusterExport = getNodeDefRoot(surveyExport)
    const clusterExportChildDefs = getNodeDefChildren(clusterExport, true)(surveyExport)

    await expect(R.isNil(clusterExport.parentUuid)).toBe(true)
    await expect(clusterExport.props.name).toBe(cluster.name)
    await expect(clusterExport.props.labels.en).toBe(cluster.label)
    await expect(clusterExportChildDefs.length).toBe(Object.keys(cluster.children).length)
    await PromiseUtils.each(clusterExportChildDefs, async (childDef) =>
      verifyNodeDef(childDef, cluster.children[childDef.props.name])
    )

    // Check Country - Region - Province hierarchy
    const countryDef = clusterExportChildDefs.find((node) => node.props.name === cluster_country.name)
    const regionDef = clusterExportChildDefs.find((node) => node.props.name === cluster_region.name)
    const provinceDef = clusterExportChildDefs.find((node) => node.props.name === cluster_province.name)

    await expect(countryDef.props.parentCodeDefUuid).toBe(null)
    await expect(regionDef.props.parentCodeDefUuid).toBe(countryDef.uuid)
    await expect(provinceDef.props.parentCodeDefUuid).toBe(regionDef.uuid)

    await expect(countryDef.props.categoryUuid).toBeTruthy()
    await expect(countryDef.props.categoryUuid).toBe(regionDef.props.categoryUuid)
    await expect(regionDef.props.categoryUuid).toBe(provinceDef.props.categoryUuid)

    // PLOT
    const plotExport = clusterExportChildDefs.find((node) => node.props.name === plot.name)
    const plotExportChildDefs = getNodeDefChildren(plotExport, true)(surveyExport)
    await PromiseUtils.each(plotExportChildDefs, async (childDef) =>
      verifyNodeDef(childDef, plot.children[childDef.props.name])
    )

    // TREE
    const treeExport = plotExportChildDefs.find((node) => node.props.name === tree.name)
    const treeExportChildDefs = getNodeDefChildren(treeExport, true)(surveyExport)
    await PromiseUtils.each(treeExportChildDefs, async (childDef) =>
      verifyNodeDef(childDef, tree.children[childDef.props.name])
    )
  })
}
