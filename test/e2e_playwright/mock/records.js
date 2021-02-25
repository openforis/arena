import path from 'path'
import fs from 'fs'
import csv from 'csv/lib/sync'

/* eslint-disable camelcase */
import { cluster, plot, tree } from './nodeDefs'
import { taxonomies } from './taxonomies'

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
const taxa = csv.parse(fs.readFileSync(taxonomyPath), { columns: true, skip_empty_lines: true })

const getRandomInRange = (from, to, fixed = 0) => (Math.random() * (to - from) + from).toFixed(fixed)

const _createTree = (idx) => {
  const taxon = taxa[Number(getRandomInRange(0, taxa.length - 1))]

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

export const createRecord = (idx) => {
  const region = `0${getRandomInRange(0, 1)}`
  const province = `${region}${getRandomInRange(0, 2)}`

  return {
    // cluster
    [cluster_id.name]: String(idx + 1),
    [cluster_decimal.name]: getRandomInRange(0, 12000, 4),
    [cluster_time.name]: () => {
      const date = new Date()
      date.setHours(getRandomInRange(0, 23))
      date.setMinutes(getRandomInRange(0, 59))
      return date
    },
    [cluster_boolean.name]: Boolean(Number(getRandomInRange(0, 1))),
    [cluster_coordinate.name]: {
      x: getRandomInRange(-180, 180, 4),
      y: getRandomInRange(-180, 180, 4),
      srs: '4326',
      srsLabel: 'GCS WGS 1984 (EPSG:4326)',
    },
    [cluster_country.name]: '(0) country 0',
    [cluster_region.name]: `(${region}) region ${region}`,
    [cluster_province.name]: `(${province}) province ${province}`,
    // plot
    [plot_id.name]: getRandomInRange(1, 10),
    [plot_text.name]: 'This is a plot text',
    trees: Array.from(Array(Number(5)).keys()).map((treeIdx) => _createTree(treeIdx)),
  }
}

export const records = Array.from(Array(3).keys()).map((idx) => createRecord(idx))
