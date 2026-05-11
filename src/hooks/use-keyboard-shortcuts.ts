import { useEffect, useEffectEvent } from 'react'
import type WaveSurfer from 'wavesurfer.js'
import { useAudioStore } from './use-audio-store'
import { SKIP_SECONDS, MIN_ZOOM, MAX_ZOOM } from '@/lib/constants'
import {
  playAudio,
  replayLoop,
  skipBackward,
  skipForward,
  stopAudio,
} from '@/lib/audio-controls'

export function useKeyboardShortcuts(
  wavesurferRef: React.RefObject<WaveSurfer | null>
) {
  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return
    }

    const ws = wavesurferRef.current
    if (!ws) return

    const state = useAudioStore.getState()

    switch (e.key) {
      case ' ':
        e.preventDefault()
        if (state.isPlaying) {
          ws.pause()
        } else {
          void playAudio(ws, state)
        }
        break

      case 'Escape':
        e.preventDefault()
        stopAudio(ws, state)
        break

      case 'Home':
        e.preventDefault()
        ws.setTime(0)
        break

      case 'r':
      case 'R':
        e.preventDefault()
        void replayLoop(ws, state)
        break

      case 'l':
      case 'L':
        e.preventDefault()
        if (state.loopRegion) {
          state.setIsLooping(!state.isLooping)
        }
        break

      case 'm':
      case 'M':
        e.preventDefault()
        state.toggleMute()
        break

      case '+':
      case '=':
        e.preventDefault()
        state.setZoomLevel(Math.min(MAX_ZOOM, state.zoomLevel * 1.2))
        break

      case '-':
        e.preventDefault()
        state.setZoomLevel(Math.max(MIN_ZOOM, state.zoomLevel / 1.2))
        break

      case 'ArrowLeft':
        e.preventDefault()
        skipBackward(ws, { ...state, seconds: SKIP_SECONDS })
        break

      case 'ArrowRight':
        e.preventDefault()
        skipForward(ws, { ...state, seconds: SKIP_SECONDS })
        break
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
