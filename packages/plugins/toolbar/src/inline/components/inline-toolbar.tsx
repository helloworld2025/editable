import {
  Editable,
  useEditableStatic,
  Slot,
  SelectionDrawing,
  useSlotActive,
  useIsomorphicLayoutEffect,
  useLocale,
  useEditable,
} from '@editablejs/editor'
import { Range } from '@editablejs/models'
import { Measurable, Popover, PopoverAnchor, PopoverContent, PopoverPortal } from '@editablejs/ui'
import * as React from 'react'
import { useInlineToolbarItems, useInlineToolbarOpen } from '../store'
import { Toolbar } from '../../components/toolbar'
import { InlineToolbarLocale } from '../locale'

export const InlineToolbar = () => {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const containerRef = React.useRef<HTMLElement | null>(null)

  const editor = useEditableStatic()

  const items = useInlineToolbarItems(editor)

  const [open, setOpen] = useInlineToolbarOpen(editor)

  const [side, setSide] = React.useState<'bottom' | 'top'>('bottom')

  const pointRef = React.useRef({ x: 0, y: 0 })
  const virtualRef = React.useRef<Measurable>({
    getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...pointRef.current }),
  })

  const handleSelectEnd = React.useCallback(() => {
    const { selection } = editor
    if (selection && Range.isExpanded(selection)) {
      let x = 0,
        y = 0

      const rects = SelectionDrawing.toRects(editor, selection, false)
      const isBackward = Range.isBackward(selection)
      if (rects.length > 0) {
        const rect = isBackward ? rects[0] : rects[rects.length - 1]
        x = isBackward ? rect.x : rect.right
        y = isBackward ? rect.y : rect.bottom
      } else {
        const range = Editable.toDOMRange(editor, selection)
        range.collapse(isBackward)
        const rect = range.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          setOpen(false)
          return
        }
        x = isBackward ? rect.x : rect.right
        y = isBackward ? rect.y : rect.bottom
      }

      pointRef.current = {
        x,
        y,
      }
      setSide(isBackward ? 'top' : 'bottom')
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [editor, setOpen])

  const isRootMouseDown = React.useRef(false)

  const handleSelectStart = React.useCallback(() => {
    if (!isRootMouseDown.current) setOpen(false)
  }, [setOpen])

  const handleSelectionChange = React.useCallback(() => {
    const { selection } = editor
    if (!selection || Range.isCollapsed(selection)) {
      setOpen(false)
    }
  }, [editor, setOpen])

  const [contentChanged, setContentChanged] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    handleSelectEnd()
    document.dispatchEvent(new CustomEvent('refreshInlineToolbarPosition'))
  }, [open, contentChanged, handleSelectEnd])

  React.useEffect(() => {
    containerRef.current = Editable.toDOMNode(editor, editor)
    const root = document.createElement('div')

    const handleMouseDown = () => {
      isRootMouseDown.current = true
    }

    const handleMouseUp = () => {
      isRootMouseDown.current = false
    }

    const handleChange = () => {
      setContentChanged({})
    }
    root.addEventListener('mousedown', handleMouseDown)
    root.addEventListener('mouseup', handleMouseUp)
    rootRef.current = root
    document.body.appendChild(root)
    editor.on('blur', handleSelectStart)
    editor.on('selectstart', handleSelectStart)
    editor.on('selectend', handleSelectEnd)
    editor.on('selectionchange', handleSelectionChange)
    editor.on('change', handleChange)
    return () => {
      document.body.removeChild(root)
      editor.off('blur', handleSelectStart)
      editor.off('selectstart', handleSelectStart)
      editor.off('selectend', handleSelectEnd)
      editor.off('selectionchange', handleSelectionChange)
      editor.off('change', handleChange)
      root.removeEventListener('mousedown', handleMouseDown)
      root.removeEventListener('mouseup', handleMouseUp)
    }
  }, [editor, handleSelectEnd, handleSelectStart, handleSelectionChange])

  const [active] = useSlotActive(InlineToolbar)
  useIsomorphicLayoutEffect(() => {
    if (active === false) {
      setOpen(false)
    }
  }, [active])

  useIsomorphicLayoutEffect(() => {
    if (open) Slot.update(editor, { active: true }, c => c === InlineToolbar)
  }, [editor, open])

  const locale = useLocale<InlineToolbarLocale>('inlineToolbar')

  if (items.length > 0 && containerRef.current && rootRef.current)
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor
          virtualRef={virtualRef}
          dispatchRefreshCustomEvent="refreshInlineToolbarPosition"
        />
        <PopoverPortal container={rootRef.current}>
          <PopoverContent side={side} sideOffset={10}>
            <Toolbar items={items} mode="inline" locale={locale} />
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    )
  return null
}
