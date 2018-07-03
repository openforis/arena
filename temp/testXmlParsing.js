const xpath = require('xpath')
const dom   = require('xmldom').DOMParser

const {readFile} = require('../common/fileUtils')

const xmlRecordPath = `${__dirname}/collect-record.xml`

const simpleSelect = async () => {
  
  const file = await readFile(xmlRecordPath)
  const doc  = new dom().parseFromString(file)
  
  const nodes = xpath.select('//tree', doc)
  
  console.log(nodes.length + ' TREES')
  
  // const node = nodes[0]
  nodes.forEach(node => {
    const res = xpath.select1('..', node)
    console.log(res.localName)
  })
  
}

const CUSTOM_FUNCTIONS = {
  'this': (ctx, value) => ctx.contextNode.textContent
}

const xPathEvaluator = async () => {
  const file = await readFile(xmlRecordPath)
  const doc  = new dom().parseFromString(file)
  
  // const evaluator = xpath.parse('//tree_species/code[this() = 488] = 488')
  const evaluator = xpath.parse('//tree_species/code[this() = 488]')
  
  const nodes = evaluator.select({
    node     : doc,
    functions: name => CUSTOM_FUNCTIONS[name]
  })
  
  console.log(nodes[0].localName)
}

// simpleSelect()
xPathEvaluator()