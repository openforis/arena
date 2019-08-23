import React, { useEffect } from 'react'

export default (elemRef, handler) => {
  const _preventDefaults = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = evt => {
    // Prevent default behavior (Prevent file from being opened)
    evt.preventDefault()
    handler([...evt.dataTransfer.items])
  }

  useEffect(() => {
    const elem = elemRef.current

    if (elem) {
      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elem.addEventListener(eventName, _preventDefaults)
        document.body.addEventListener(eventName, _preventDefaults)
      })

      elem.addEventListener('drop', handleDrop)
    }

    // Remove document.body event listeners on unmount
    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.removeEventListener(eventName, _preventDefaults)
      })
    }
  }, [elemRef.current])
}