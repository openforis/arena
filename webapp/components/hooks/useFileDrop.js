import { useEffect } from 'react'

export default (handler, elemRef, acceptedTypes) => {
  const eventTypes = ['dragenter', 'dragover', 'dragleave', 'drop']

  const _preventDefaults = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (evt) => {
    // Prevent default behavior (Prevent file from being opened)
    _preventDefaults(evt)

    const fileItems = [...evt.dataTransfer.items]

    const fileItem = fileItems.find(
      (item) => !acceptedTypes || acceptedTypes.find((acceptedType) => acceptedType.test(item.type))
    )

    if (fileItem) {
      handler(fileItem.getAsFile())
    }
  }

  useEffect(() => {
    const elem = elemRef.current

    if (elem) {
      // Prevent default drag behaviors
      eventTypes.forEach((eventName) => {
        elem.addEventListener(eventName, _preventDefaults)
        document.body.addEventListener(eventName, _preventDefaults)
      })

      elem.addEventListener('drop', handleDrop)
    }

    // Remove document.body event listeners on unmount
    return () => {
      eventTypes.forEach((eventName) => {
        document.body.removeEventListener(eventName, _preventDefaults)
      })

      elem.removeEventListener('drop', handleDrop)
    }
  }, [elemRef.current])
}
