import { useCallback, useEffect, useRef, useState } from 'react'
import { MusicIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useFetch, type Fetcher } from '@renderer/hooks/fetch'
import { useInputReducer } from '@renderer/hooks/navigation'
import { useInterval } from '@renderer/hooks/interval'

type SyncedLyric = {
  text: string
  timestamp: number
}

type LyricsRecord = {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: string
  plainLyrics?: string
  syncedLyrics?: string
}

// How often to refresh interval and rerender with latest lyrics in ms
const refreshInterval = 200 as const

// Lyric offset in ms
const globalOffset = -200 as const

async function fetchLyrics(
  params: Record<string, string>,
  fetch: Fetcher,
  request: RequestInit
): Promise<SyncedLyric[]> {
  // Create query from given params
  const endpoint =
    'https://lrclib.net:443/api/search?' +
    Object.entries(params)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('&')

  // Check if already in cache
  const cached = await window.cache.get<SyncedLyric[]>(endpoint)

  // Return early if hit
  if (cached) return cached

  // Otherwise fetch from API
  const res = await fetch<LyricsRecord[]>(endpoint, request)

  // Early return for unsuccesful request
  if (!res.data) return []

  // Find a record with synced lyrics
  const lyricsRecord = res.data.find((record) => 'syncedLyrics' in record)

  // Return if not present
  if (!lyricsRecord) return []

  // Extract lyrics as an array of objects from response
  const lyrics: SyncedLyric[] =
    lyricsRecord.syncedLyrics?.split('\n').map((lyric) => {
      // Capture data from raw text
      const [, minutes, seconds, centis, text] = lyric.match(/\[(\d+):(\d+)\.(\d+)\]\s?(.+)/) ?? []

      // Calculate timestamp in millis
      const timestamp = Number(minutes) * 60000 + Number(seconds) * 1000 + Number(centis) * 10

      // Return final lyric object
      return { timestamp, text }
    }) ?? []

  // Update cache
  window.cache.set(endpoint, lyrics)

  return lyrics
}

type SongMetadata = { title: string; artist: string }

function Lyrics({
  title,
  artist,
  playing
}: SongMetadata & { playing: boolean }): React.JSX.Element {
  const [lyrics, setLyrics] = useState<SyncedLyric[]>([])
  const [index, setIndex] = useState<number>(0)

  // Track current player position
  const position = useRef(0)

  // Function for updating position while refreshing index
  const setPosition = useCallback(
    (pos?: number) => {
      position.current = pos == null ? position.current + refreshInterval : pos
      const newIndex =
        lyrics.findLastIndex((l) => l.timestamp + globalOffset <= position.current) ?? 0
      if (newIndex != index) setIndex(newIndex)
    },
    [lyrics, index]
  )

  // Create interval for updating position
  useInterval(setPosition, playing ? refreshInterval : null)

  // Function for incrementing current lyric by n lines
  const incrementIndex = (n: number): void => {
    const newIndex = Math.max(0, Math.min(lyrics.length - 1, index + n))
    if (newIndex !== index) window.api.seekPlayer(lyrics[newIndex].timestamp)
  }

  // Hook into input reducer
  useInputReducer({
    ArrowDown: () => incrementIndex(1),
    ArrowUp: () => incrementIndex(-1)
  })

  // Create state for query to reflect loading
  const [query, fetch] = useFetch()

  // Fetch lyrics upon song change
  useEffect(() => {
    console.warn('Fetching lyrics...')

    // Create controller to cancel requests
    const controller = new AbortController()
    const { signal } = controller

    fetchLyrics({ artist_name: artist, track_name: title }, fetch, { signal }).then(setLyrics)

    // Reset position
    window.api.playerPosition().then((pos) => (position.current = pos))

    return () => controller.abort()
  }, [title, artist, fetch])

  // Update position when player position changes
  useEffect(() => {
    return window.api.onPlayerPosition(setPosition)
  }, [setPosition])

  // Get initial player position and after unpausing
  useEffect(() => {
    window.api.playerPosition().then((pos) => (position.current = pos))
  }, [playing])

  // Scroll current lyric to center
  useEffect(
    () =>
      document.getElementById('current')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    [index]
  )

  // A factory for click handlers that seek to the clicked lyric
  const clickHandlerFactory = (pos: number) => () => window.api.seekPlayer(pos)

  console.log('Lyrics rerender...')

  return (
    <div className="lyrics">
      <div className="offset" />
      {query.status === 'LOADING' ? (
        <p>Loading...</p>
      ) : (
        lyrics.length === 0 && <p>No lyrics available</p>
      )}
      {lyrics.map((l, i) => {
        const diff = Math.min(Math.abs((i - index) * 2) ** 0.7, 4)
        return (
          <motion.p
            id={i === index ? 'current' : undefined}
            onClick={clickHandlerFactory(l.timestamp)}
            key={l.timestamp}
            animate={{
              scale: 1 - diff * 0.1,
              opacity: 1 - diff * 0.05,
              marginBlock: (4 - diff) * 6,
              filter: `blur(${diff * 0.5}px) drop-shadow(0 0 10px ${diff === 0 ? 'rgba(255 255 255 / 0.5)' : 'transparent'})`
            }}
            className="tip"
          >
            {l.text?.trim() || <MusicIcon size={32} />}
          </motion.p>
        )
      })}
      <div className="offset" />
    </div>
  )
}

export default Lyrics
