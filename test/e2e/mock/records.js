import path from 'path'

/* eslint-disable camelcase */
import { cluster, plot, tree } from './nodeDefs'
import { taxonomies } from './taxonomies'
import { parseCsv } from '../../utils/csvUtils'

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

const taxonomy = taxonomies[tree_species.taxonomy]
const taxonomyPath = path.resolve(__dirname, '..', 'resources', `${taxonomy.name}_predefined.csv`)
const taxa = parseCsv(taxonomyPath)

const getRandomInRange = (from, to, fixed = 0) => (Math.random() * (to - from) + from).toFixed(fixed)

const _createTree = (idx) => {
  const taxon = taxa[idx % taxa.length]
  return {
    [tree_id.name]: String(idx + 1),
    [tree_dec_1.name]: getRandomInRange(1, 50000, 5),
    [tree_dec_2.name]: getRandomInRange(11, 100000, 5),
    [tree_species.name]: {
      code: taxon.code,
      scientificName: taxon.scientific_name,
      vernacularName: '',
    },
  }
}

const _createRecord = (idx) => {
  const clusterRegion = `0${getRandomInRange(0, 1)}`
  const clusterProvince = `${clusterRegion}${getRandomInRange(0, 2)}`
  const clusterTime = new Date()
  clusterTime.setHours(getRandomInRange(0, 23))
  clusterTime.setMinutes(Math.floor(getRandomInRange(0, 59) / 5) * 5) //random minutes multiples of 5 (time picker shows minutes in this way)

  return {
    // cluster
    [cluster_id.name]: String(idx + 1),
    [cluster_decimal.name]: getRandomInRange(0, 12000, 4),
    [cluster_time.name]: clusterTime,
    [cluster_boolean.name]: Boolean(Number(getRandomInRange(0, 1))),
    [cluster_coordinate.name]: {
      x: getRandomInRange(-90, 90, 4),
      y: getRandomInRange(-90, 90, 4),
      srs: '4326',
      srsLabel: 'WGS 1984 (EPSG:4326)',
    },
    [cluster_country.name]: 'country 0 (0)',
    [cluster_region.name]: `region ${clusterRegion} (${clusterRegion})`,
    [cluster_province.name]: `province ${clusterProvince} (${clusterProvince})`,
    // plot
    [plot_id.name]: getRandomInRange(1, 10),
    [plot_text.name]: 'This is a plot text',
    trees: Array.from(Array(Number(5)).keys()).map((treeIdx) => _createTree(treeIdx)),
  }
}

let _records = null
const _getRecords = () => {
  if (_records) return _records
  _records = Array.from(Array(3).keys()).map((idx) => _createRecord(idx))
  return _records
}

export const records = _getRecords()
