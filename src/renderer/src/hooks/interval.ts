import { useEffect, useRef } from 'react'

export function useInterval(callback: () => void, delay?: number | null): void {
  const callbackRef = useRef(callback)

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Start interval
  useEffect(() => {
    if (delay == null) return
    const interval = setInterval(() => callbackRef.current(), delay)
    return () => clearInterval(interval)
  }, [delay])
}
