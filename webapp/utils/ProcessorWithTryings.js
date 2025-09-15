export class ProcessorWithTryings {
  constructor({ processor, onSuccess, onFail, maxTryings = 10 }) {
    this.processor = processor
    this.onSuccess = onSuccess
    this.onFail = onFail
    this.maxTryings = maxTryings

    this.currentTrying = 0
    this.running = false
  }

  start() {
    this.running = true
    this._processNext()
  }

  stop() {
    this.running = false
  }

  _processNext() {
    this.currentTrying += 1

    this.processor()
      .then((res) => {
        this.onSuccess(res)
      })
      .catch((error) => {
        if (this.running && this.currentTrying < this.maxTryings) {
          this._processNext()
        } else {
          this.onFail(error)
        }
      })
  }
}
