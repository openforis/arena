import { DataTestId } from '../../../webapp/utils/dataTestId'
import { editNodeDefExpression } from './_nodeDefDetails'
import { cluster, plot, tree } from '../mock/nodeDefs'
import { gotoFormDesigner } from './_navigation'
import { editNodeDef, gotoFormPage } from './_formDesigner'
import { publishWithoutErrors } from './_publish'

// eslint-disable-next-line camelcase
const { cluster_date, cluster_time, cluster_boolean, cluster_country } = cluster.children
// eslint-disable-next-line camelcase
const { tree_dec_1, tree_dec_2, tree_species } = tree.children

const nodeDefExpressions = {
  cluster_date: [
    {
      type: DataTestId.nodeDefDetails.defaultValues,
      expression: 'now()',
    },
  ],
  cluster_time: [
    {
      type: DataTestId.nodeDefDetails.defaultValues,
      expression: 'now()',
    },
  ],
  cluster_country: [
    {
      type: DataTestId.nodeDefDetails.defaultValues,
      expression: '0',
    },
  ],
  cluster_boolean: [
    {
      type: DataTestId.nodeDefDetails.defaultValues,
      expression: 'True',
    },
  ],
  plot: [
    {
      type: DataTestId.nodeDefDetails.relevantIf,
      expression: 'cluster_id > 0',
    },
  ],
  tree_dec_1: [
    {
      type: DataTestId.nodeDefDetails.validations,
      expression: 'tree_dec_1 > 0',
    },
  ],
  tree_dec_2: [
    {
      type: DataTestId.nodeDefDetails.validations,
      expression: 'tree_dec_2 > 0',
      applyIf: 'tree_dec_1 > 10',
    },
    {
      type: DataTestId.nodeDefDetails.validations,
      expression: 'tree_dec_2 > 10',
    },
  ],
  tree_species: [
    {
      type: DataTestId.nodeDefDetails.defaultValues,
      expression: 'ALB/GLA',
    },
  ],
}

const editExpression = (nodeDef) => {
  editNodeDef(nodeDef.name, nodeDef, false)
  editNodeDefExpression(nodeDef, nodeDefExpressions[nodeDef.name])
}

export default () =>
  describe('NodeDef expressions edit', () => {
    gotoFormDesigner()

    editExpression(cluster_date)
    editExpression(cluster_time)
    editExpression(cluster_boolean)
    editExpression(cluster_country)

    gotoFormPage(plot)

    editExpression(plot)
    editExpression(tree_dec_1)
    editExpression(tree_dec_2)
    editExpression(tree_species)

    publishWithoutErrors()
  })
