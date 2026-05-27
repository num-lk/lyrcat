import { useEffect, useState } from 'react'
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon } from 'lucide-react'
import { useInputReducer } from '@renderer/hooks/navigation'
import Lyrics from './components/Lyrics'

function App(): React.JSX.Element {
  const pauseHandle = (): void => window.api.pausePlayer()
  const forwardHandle = (): void => window.api.forwardPlayer()
  const backHandle = (): void => window.api.backPlayer()

  const [meta, setMeta] = useState<{ title: string; artist: string }>(null!)
  const [playing, setPlaying] = useState(false)

  // Hook into input reducer
  useInputReducer({
    Space: pauseHandle,
    ArrowLeft: backHandle,
    ArrowRight: forwardHandle
  })

  // Get initial player state
  useEffect(() => {
    const queryPlayer = async (): Promise<void> => {
      const playing = await window.api.playerStatus()
      const [artist, title] = await window.api.playerMeta()

      setPlaying(playing)
      setMeta({ artist, title })
    }
    queryPlayer()
  }, [])

  // Sync player state with pause state
  useEffect(() => {
    return window.api.onPlayerStatus(setPlaying)
  }, [])

  // Sync metadata
  useEffect(() => {
    return window.api.onPlayerUpdate(setMeta)
  }, [])

  console.log('App rerender...')

  return (
    <>
      {meta ? (
        <div className="text">
          Now listening to <span className="ts">{meta.title}</span>
          &nbsp;by <span className="react">{meta.artist}</span>
        </div>
      ) : (
        <div className="text">Hello!</div>
      )}
      {meta ? (
        <Lyrics {...meta} playing={playing} />
      ) : (
        <p className="tip">Got nothing to show here...</p>
      )}
      <div className="actions">
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={backHandle}>
            <SkipBackIcon />
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={pauseHandle}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={forwardHandle}>
            <SkipForwardIcon />
          </a>
        </div>
      </div>
    </>
  )
}

export default App
