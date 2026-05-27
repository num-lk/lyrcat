import { useEffect } from 'react'

export function useInputReducer(
  reducer: Record<string, (e: KeyboardEvent) => void>,
  event: 'keydown' | 'keypress' = 'keydown'
): void {
  useEffect(() => {
    // Create input handler that calls functions from reducer
    const onInputHandler = (e: KeyboardEvent): void => {
      const handler = reducer[e.code]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    // Subsribe to document events
    document.addEventListener(event, onInputHandler)

    return () => document.removeEventListener(event, onInputHandler)
  }, [event, reducer])
}
