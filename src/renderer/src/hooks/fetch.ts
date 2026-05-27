import { useCallback, useState } from 'react'

export type Query<T extends object = object> = {
  data: T
  error: { code: number; detail?: string | null } | null
  status: HTTPStatus
}

export type Fetcher<T extends object = object> = (<K extends T = T>(
  endpoint: string,
  request?: RequestInit
) => Promise<Query<K>>) & {
  preload?: (endpoint: string, request?: RequestInit) => void
}

export const status = {
  idle: 'IDLE',
  loading: 'LOADING',
  success: 'SUCCESS',
  error: 'ERROR'
} as const

type HTTPStatus = (typeof status)[keyof typeof status]

export async function loadJSON<T extends object = object>(
  url: string,
  request: RequestInit = {}
): Promise<Query<T>> {
  let res: Response = null!
  try {
    res = await fetch(url, request)
    const data = res.status === 204 ? null : await res.json()
    if (res.ok) {
      return { data, error: null, status: status.success }
    } else {
      return {
        data: null!,
        status: status.error,
        error: {
          code: res.status,
          detail: typeof data?.['detail'] === 'string' ? data['detail'] : null
        }
      }
    }
  } catch (e) {
    console.error(`Failed to fetch ${url}! - ${e}`)
    const code = res?.status ?? 0
    const error = { code, detail: null }
    return { data: null!, error, status: status.error }
  }
}

// Simple suspense-based fetch mechanism with caching
export function useFetch<T extends object = object>(
  fetcher: Fetcher<T> = loadJSON
): [Query<T>, Fetcher<T>] {
  const [query, setQuery] = useState<Query<T>>(() => ({
    data: null!,
    error: null,
    status: status.idle
  }))

  const fetch = useCallback(
    async <K extends T = T>(endpoint: string, request: RequestInit = {}): Promise<Query<K>> => {
      // Update status to reflect loading
      setQuery((prevQuery) => ({ ...prevQuery, status: status.loading }))

      // Fetch data
      const res = await fetcher<K>(endpoint, request)

      // Set error state upon failure
      setQuery(res)

      return res
    },
    [fetcher]
  )

  // Attach preload method
  //fetch.preload = (endpoint: string, request: RequestInit = {}) =>
  //  fetcher(endpoint, request).then((res) => cache.set(endpoint, res))

  return [query, fetch]
}
