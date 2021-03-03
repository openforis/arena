import { DataTestId } from '../../../webapp/utils/dataTestId'

export const nodeDefExpressions = {
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
