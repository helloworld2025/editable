import * as React from 'react'
import { Node } from '@editablejs/models'
import { useStore } from 'zustand'
import { Placeholder } from '../plugin/placeholder'
import { useEditableStatic } from './use-editable'

export const usePlaceholderStore = () => {
  const editor = useEditableStatic()
  return React.useMemo(() => {
    return Placeholder.getStore(editor)
  }, [editor])
}

export const usePlaceholders = () => {
  const store = usePlaceholderStore()
  const placeholders = useStore(store, state => state.placeholders)
  return placeholders
}

export const usePlaceholder = (node: Node) => {
  const store = usePlaceholderStore()
  const current = useStore(store, state => state.current)
  return React.useMemo(() => {
    if (!current) return
    return current.node === node ? current.render : undefined
  }, [current, node])
}
