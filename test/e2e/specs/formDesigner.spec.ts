import { expect, test } from '../fixtures'
import { FormDesigner } from '../helpers/formDesigner'
import { publishSurvey, publishSurveyWithErrors } from '../helpers/publish'
import { exportSurvey } from '../helpers/surveyExport'

const rootEntityName = 'root_entity'

const clusterAttributes = [
  { type: 'integer', name: 'cluster_id', label: 'Cluster id', key: true },
  { type: 'decimal', name: 'cluster_decimal', label: 'Cluster decimal' },
  { type: 'date', name: 'cluster_date', label: 'Cluster date' },
  { type: 'time', name: 'cluster_time', label: 'Cluster time' },
  { type: 'boolean', name: 'cluster_boolean', label: 'Cluster boolean' },
  { type: 'coordinate', name: 'cluster_coordinate', label: 'Cluster coordinate', unique: true },
]
const plotAttributes = [
  { type: 'integer', name: 'plot_id', label: 'Plot id', key: true },
  { type: 'text', name: 'plot_text', label: 'Plot text' },
  { type: 'file', name: 'plot_file', label: 'Plot file' },
]
const treeAttributes = [
  { type: 'integer', name: 'tree_id', label: 'Tree id', key: true },
  { type: 'decimal', name: 'tree_dec_1', label: 'Tree decimal 1' },
]

test.describe('Form designer', () => {
  // long UI flow (many node defs edited and saved one by one)
  test.slow()

  test('shows the errors of the root entity and prevents publishing', async ({ page, survey: _ }) => {
    const designer = new FormDesigner(page)
    await designer.goto()

    await designer.errorBadge(rootEntityName).hover()
    await expect(page.getByText('Define at least one key attribute')).toBeVisible()
    await expect(page.getByText('Define at least one child item')).toBeVisible()

    await publishSurveyWithErrors(page, ['Define at least one key attribute', 'Define at least one child item'])
  })

  test('builds the survey schema: attributes, entities in own page and tables', async ({
    page,
    survey: _,
  }, testInfo) => {
    const designer = new FormDesigner(page)
    await designer.goto()

    // root entity
    await designer.edit(rootEntityName)
    await designer.fillDetails({ name: 'cluster', label: 'Cluster' })
    await designer.saveAndBack('Cluster')

    for (const { type, ...details } of clusterAttributes) {
      await designer.addChildWithDetails('cluster', type, details)
    }

    // plot: multiple entity displayed in its own page
    await designer.addSubPage()
    await designer.fillDetails({ name: 'plot', label: 'Plot', multiple: true })
    await designer.saveAndBack('Plot')
    for (const { type, ...details } of plotAttributes) {
      await designer.addChildWithDetails('plot', type, details)
    }

    // tree: multiple entity displayed as a table inside the plot page
    await designer.addChildWithDetails('plot', 'entity', { name: 'tree', label: 'Tree', multiple: true })
    for (const { type, ...details } of treeAttributes) {
      await designer.addChildWithDetails('tree', type, details)
    }

    await publishSurvey(page)

    const surveyExport = await exportSurvey(page, testInfo, { withData: false })
    const expectChildren = (parentName: string, expected: { type: string; name: string; key?: boolean }[]) => {
      const children = surveyExport.childDefs(surveyExport.nodeDefByName(parentName))
      expect(
        children.map((nodeDef) => ({
          type: nodeDef.type,
          name: nodeDef.props.name,
          key: Boolean(nodeDef.props.key),
        }))
      ).toEqual(expected.map(({ type, name, key }) => ({ type, name, key: Boolean(key) })))
    }
    expectChildren('cluster', [...clusterAttributes, { type: 'entity', name: 'plot' }])
    expectChildren('plot', [...plotAttributes, { type: 'entity', name: 'tree' }])
    expectChildren('tree', treeAttributes)
    expect(surveyExport.nodeDefByName('plot').props.multiple).toBe(true)
    expect(surveyExport.nodeDefByName('tree').props.multiple).toBe(true)
    expect(surveyExport.nodeDefByName('cluster_coordinate').propsAdvanced.validations.unique).toBe(true)
  })
})
