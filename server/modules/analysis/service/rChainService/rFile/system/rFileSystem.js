import RFile from '../rFile'

export default class RFileSystem extends RFile {
  constructor(rChain, fileName) {
    super(rChain, rChain.dirSystem, fileName)
  }
}
