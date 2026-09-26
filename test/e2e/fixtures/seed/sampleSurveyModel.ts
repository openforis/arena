/**
 * Model of the sample survey used by most of the specs (cluster -> plot -> tree),
 * the same one that the legacy e2e scenario built step by step through the UI.
 */

export type NodeDefType =
  'boolean' | 'code' | 'coordinate' | 'date' | 'decimal' | 'entity' | 'file' | 'integer' | 'taxon' | 'text' | 'time'

export type SampleNodeDef = {
  name: string
  label: string
  type: NodeDefType
  key?: boolean
  unique?: boolean
  multiple?: boolean
  category?: string
  parentCode?: string
  taxonomy?: string
}

const attribute = (name: string, label: string, type: NodeDefType, extra: Partial<SampleNodeDef> = {}) => ({
  name,
  label,
  type,
  ...extra,
})

export const category = {
  name: 'administrative_unit',
  levels: [
    { name: 'country', codes: 1 },
    { name: 'region', codes: 2 },
    { name: 'province', codes: 3 },
  ],
}

export type SampleCategoryItem = { code: string; label: string; children: SampleCategoryItem[] }

const createCategoryItems = (levelIdx = 0, codePrefix = ''): SampleCategoryItem[] => {
  const level = category.levels[levelIdx]
  if (!level) return []
  return Array.from({ length: level.codes }, (_, itemIdx) => {
    const code = `${codePrefix}${itemIdx}`
    return { code, label: `${level.name} ${code}`, children: createCategoryItems(levelIdx + 1, code) }
  })
}

// country 0 > regions 00, 01 > provinces 000, 001, 002, 010, 011, 012
export const categoryItems = createCategoryItems()

export const flattenCategoryItems = (items: SampleCategoryItem[] = categoryItems): SampleCategoryItem[] =>
  items.flatMap((item) => [item, ...flattenCategoryItems(item.children)])

export const taxonomy = {
  name: 'species_list',
  description: 'Species list',
}

export const cluster = {
  name: 'cluster',
  label: 'Cluster',
  type: 'entity' as const,
  children: {
    cluster_id: attribute('cluster_id', 'Cluster id', 'integer', { key: true }),
    cluster_decimal: attribute('cluster_decimal', 'Cluster decimal', 'decimal'),
    cluster_date: attribute('cluster_date', 'Cluster date', 'date'),
    cluster_time: attribute('cluster_time', 'Cluster time', 'time'),
    cluster_boolean: attribute('cluster_boolean', 'Cluster boolean', 'boolean'),
    cluster_coordinate: attribute('cluster_coordinate', 'Cluster coordinate', 'coordinate', { unique: true }),
    cluster_country: attribute('cluster_country', 'Cluster country', 'code', { category: category.name }),
    cluster_region: attribute('cluster_region', 'Cluster region', 'code', {
      category: category.name,
      parentCode: 'cluster_country',
    }),
    cluster_province: attribute('cluster_province', 'Cluster province', 'code', {
      category: category.name,
      parentCode: 'cluster_region',
    }),
  },
}

export const plot = {
  name: 'plot',
  label: 'Plot',
  type: 'entity' as const,
  multiple: true,
  children: {
    plot_id: attribute('plot_id', 'Plot id', 'integer', { key: true }),
    plot_text: attribute('plot_text', 'Plot text', 'text'),
    plot_file: attribute('plot_file', 'Plot file', 'file'),
  },
}

export const tree = {
  name: 'tree',
  label: 'Tree',
  type: 'entity' as const,
  multiple: true,
  children: {
    tree_id: attribute('tree_id', 'Tree id', 'integer', { key: true }),
    tree_dec_1: attribute('tree_dec_1', 'Tree decimal 1', 'decimal'),
    tree_dec_2: attribute('tree_dec_2', 'Tree decimal 2', 'decimal'),
    tree_species: attribute('tree_species', 'Tree Species', 'taxon', { taxonomy: taxonomy.name, unique: true }),
  },
}

/**
 * Expressions set on the sample survey node defs (when the survey is created "with expressions").
 */
export const nodeDefExpressions = {
  defaultValues: {
    cluster_date: 'now()',
    cluster_time: 'now()',
    cluster_country: "'0'",
    cluster_boolean: 'true',
    tree_species: "'ALB/GLA'",
  },
  relevantIf: {
    plot: 'cluster_id > 0',
  },
  validations: {
    tree_dec_1: [{ expression: 'tree_dec_1 > 0' }],
    tree_dec_2: [{ expression: 'tree_dec_2 > 0', applyIf: 'tree_dec_1 > 10' }, { expression: 'tree_dec_2 > 10' }],
  },
}

// ===== records

export type SampleTree = {
  tree_id: string
  tree_dec_1: string
  tree_dec_2: string
  tree_species: string // taxon code
}

export type SampleRecord = {
  cluster_id: string
  cluster_decimal: string
  cluster_date: string // YYYY-MM-DD
  cluster_time: string // HH:mm
  cluster_boolean: 'true' | 'false'
  cluster_coordinate: { x: string; y: string; srs: string }
  cluster_country: string // category item code
  cluster_region: string
  cluster_province: string
  plot_id: string
  plot_text: string
  trees: SampleTree[]
}

const speciesCodes = ['AFZ/QUA', 'ALB/ADI', 'ALB/GLA', 'BOU/PET', 'ALB/SCH']

const createRecord = (idx: number): SampleRecord => {
  const region = `0${idx % 2}`
  return {
    cluster_id: String(idx + 1),
    cluster_decimal: `${1000 + idx}.25`,
    cluster_date: `2024-05-1${idx}`,
    cluster_time: `1${idx}:25`,
    cluster_boolean: idx % 2 === 0 ? 'true' : 'false',
    cluster_coordinate: { x: `${12 + idx}.5`, y: `${41 + idx}.9`, srs: '4326' },
    cluster_country: '0',
    cluster_region: region,
    cluster_province: `${region}${idx % 3}`,
    plot_id: String(idx + 1),
    plot_text: `This is plot text ${idx + 1}`,
    trees: speciesCodes.map((speciesCode, treeIdx) => ({
      tree_id: String(treeIdx + 1),
      tree_dec_1: `${10 * (treeIdx + 1) + idx}.5`,
      tree_dec_2: `${20 * (treeIdx + 1) + idx}.75`,
      tree_species: speciesCode,
    })),
  }
}

export const sampleRecords: SampleRecord[] = [0, 1, 2].map(createRecord)
