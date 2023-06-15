/* eslint-disable camelcase */
import { cluster, plot, tree } from './nodeDefs'

const {
  cluster_id,
  cluster_decimal,
  cluster_time,
  cluster_boolean,
  cluster_coordinate,
  cluster_country,
  cluster_region,
  cluster_province,
} = cluster.children
const { plot_id, plot_text } = plot.children
const { tree_id, tree_dec_1, tree_dec_2, tree_species } = tree.children

export const recordPreview = {
  // cluster
  [cluster_id.name]: '1',
  [cluster_decimal.name]: '5674597.23',
  [cluster_time.name]: () => {
    const date = new Date()
    date.setHours(12)
    date.setMinutes(25)
    return date
  },
  [cluster_boolean.name]: 'false',
  [cluster_coordinate.name]: { x: '342.432', y: '3424.231', srs: '4326', srsLabel: 'WGS 1984 (EPSG:4326)' },
  [cluster_country.name]: '(0) country 0',
  [cluster_region.name]: '(01) region 01',
  [cluster_province.name]: '(012) province 012',
  // plot
  [plot_id.name]: '1',
  [plot_text.name]: 'This is a plot text',
  trees: [
    {
      [tree_id.name]: '1',
      [tree_dec_1.name]: '0',
      [tree_dec_2.name]: '8.543',
      [tree_species.name]: {
        code: 'BOU/PET',
        scientificName: 'Bourreria petiolaris',
        vernacularName: '',
      },
    },
    {
      [tree_id.name]: '1',
      [tree_dec_1.name]: '10.5432',
      [tree_dec_2.name]: '0',
      [tree_species.name]: {
        code: 'ALB/ADI',
        scientificName: 'Albizia adianthifolia',
        vernacularName: '',
      },
    },
  ],
}
