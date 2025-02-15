import * as React from 'react'
import { Node as SlateNode } from '@editablejs/models'
import { NODE_TO_RESTORE_DOM } from '../utils/weak-maps'

export function useContentKey(node: SlateNode) {
  const contentKeyRef = React.useRef<number>(0)
  const updateAnimationFrameRef = React.useRef<number | null>(null)

  const [, setForceRerenderCounter] = React.useState(0)

  React.useEffect(() => {
    NODE_TO_RESTORE_DOM.set(node, () => {
      // Update is already queued and node hasn't re-render yet
      if (updateAnimationFrameRef.current) {
        return
      }

      updateAnimationFrameRef.current = requestAnimationFrame(() => {
        setForceRerenderCounter(state => state + 1)
        updateAnimationFrameRef.current = null
      })

      contentKeyRef.current++
    })

    return () => {
      NODE_TO_RESTORE_DOM.delete(node)
    }
  }, [node])

  // Node was restored => clear scheduled update
  if (updateAnimationFrameRef.current) {
    cancelAnimationFrame(updateAnimationFrameRef.current)
    updateAnimationFrameRef.current = null
  }

  return contentKeyRef.current
}
