import { RefObject, useEffect, useRef } from 'react'

export function useInputReducer<T extends HTMLElement>(
  reducer: Record<string, (e: KeyboardEvent) => void>,
  capture: boolean = false,
  event: 'keydown' | 'keypress' = 'keydown'
): RefObject<T> {
  const elementRef = useRef<T>(null!)

  useEffect(() => {
    // Get current element from ref or use document
    const element = elementRef.current ?? document

    // Create input handler that calls functions from reducer
    const onInputHandler = (e: KeyboardEvent): void => {
      // Capture input if specified
      if (capture) e.stopPropagation()

      // Get handler from reducer
      const handler = reducer[e.code]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    // Subsribe to document events
    element.addEventListener(event, onInputHandler, capture)

    return () => element.removeEventListener(event, onInputHandler, capture)
  }, [event, reducer, capture, elementRef])

  return elementRef
}
