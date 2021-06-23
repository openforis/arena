import * as R from 'ramda'

import * as PromiseUtils from '../../../../core/promiseUtils'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'
import { cluster, plot, tree } from '../../mock/nodeDefs'
import { getLabel, getNodeDefChildren, getNodeDefRoot, getProps } from './_surveyUtils'

// eslint-disable-next-line camelcase
const { cluster_country, cluster_region, cluster_province } = cluster.children

const _getNodeDefName = (nodeDef) => getProps(nodeDef).name
const _findNodeDefByName = (nodeDefs, name) => nodeDefs.find((nodeDef) => _getNodeDefName(nodeDef) === name)

const verifyNodeDef = async (nodeDefExport, nodeDefMock) => {
  const { type, analysis } = nodeDefExport
  const { name, key = false } = getProps(nodeDefExport)

  await expect(name).toBe(nodeDefMock.name)
  await expect(getLabel(nodeDefExport, 'en')).toBe(nodeDefMock.label)
  await expect(type).toBe(nodeDefMock.type)
  await expect(key).toBe(nodeDefMock.key || false)
  await expect(analysis).toBe(nodeDefMock.analysis || false)
}

export const verifyNodeDefs = (survey) => {
  test(`Verify ${survey.name} nodeDefs`, async () => {
    const surveyExport = getSurveyEntry(survey, ExportFile.survey)
    const clusterExport = getNodeDefRoot(surveyExport)
    const clusterExportChildDefs = getNodeDefChildren(clusterExport)(surveyExport)

    await expect(R.isNil(clusterExport.parentUuid)).toBe(true)
    await expect(getProps(clusterExport).name).toBe(cluster.name)
    await expect(getProps(clusterExport).labels.en).toBe(cluster.label)
    await expect(clusterExportChildDefs.length).toBe(Object.keys(cluster.children).length)
    await PromiseUtils.each(clusterExportChildDefs, async (childDef) =>
      verifyNodeDef(childDef, cluster.children[_getNodeDefName(childDef)])
    )

    // Check Country - Region - Province hierarchy
    const countryDef = _findNodeDefByName(clusterExportChildDefs, cluster_country.name)
    const regionDef = _findNodeDefByName(clusterExportChildDefs, cluster_region.name)
    const provinceDef = _findNodeDefByName(clusterExportChildDefs, cluster_province.name)

    await expect(getProps(countryDef).parentCodeDefUuid).toBe(null)
    await expect(getProps(regionDef).parentCodeDefUuid).toBe(countryDef.uuid)
    await expect(getProps(provinceDef).parentCodeDefUuid).toBe(regionDef.uuid)

    await expect(getProps(countryDef).categoryUuid).toBeTruthy()
    await expect(getProps(countryDef).categoryUuid).toBe(getProps(regionDef).categoryUuid)
    await expect(getProps(regionDef).categoryUuid).toBe(getProps(provinceDef).categoryUuid)

    // PLOT
    const plotExport = _findNodeDefByName(clusterExportChildDefs, plot.name)
    const plotExportChildDefs = getNodeDefChildren(plotExport)(surveyExport)
    await PromiseUtils.each(plotExportChildDefs, async (childDef) =>
      verifyNodeDef(childDef, plot.children[_getNodeDefName(childDef)])
    )

    // TREE
    const treeExport = _findNodeDefByName(plotExportChildDefs, tree.name)
    const treeExportChildDefs = getNodeDefChildren(treeExport)(surveyExport)
    await PromiseUtils.each(treeExportChildDefs, async (childDef) =>
      verifyNodeDef(childDef, tree.children[_getNodeDefName(childDef)])
    )
  })
}
