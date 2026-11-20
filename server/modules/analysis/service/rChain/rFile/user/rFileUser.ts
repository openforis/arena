import RFile from '../rFile'

export default class RFileUser extends RFile {
  constructor(rChain, fileName) {
    super(rChain, rChain.dirUser, fileName)
  }
}
