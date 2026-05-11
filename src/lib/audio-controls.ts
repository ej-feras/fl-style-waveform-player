import type WaveSurfer from 'wavesurfer.js'
import type { LoopRegion } from '@/hooks/use-audio-store'

interface PlaybackContext {
  isLooping: boolean
  loopRegion: LoopRegion | null
}

interface LivePlaybackContext extends PlaybackContext {
  isPlaying: boolean
}

interface SkipOptions extends PlaybackContext {
  seconds: number
}

function getLoopStart({ isLooping, loopRegion }: PlaybackContext) {
  return isLooping && loopRegion ? loopRegion.start : null
}

export function playAudio(
  wavesurfer: WaveSurfer,
  { isLooping, loopRegion }: PlaybackContext
) {
  if (isLooping && loopRegion) {
    return wavesurfer.play(loopRegion.start, loopRegion.end)
  }

  return wavesurfer.play()
}

export function stopAudio(
  wavesurfer: WaveSurfer,
  { isLooping, loopRegion }: PlaybackContext
) {
  wavesurfer.stop()

  const loopStart = getLoopStart({ isLooping, loopRegion })
  if (loopStart !== null) {
    wavesurfer.setTime(loopStart)
  }
}

export function replayLoop(
  wavesurfer: WaveSurfer,
  { isLooping, loopRegion }: PlaybackContext
) {
  if (!loopRegion) return

  if (isLooping) {
    return wavesurfer.play(loopRegion.start, loopRegion.end)
  }

  return wavesurfer.play(loopRegion.start)
}

export function skipBackward(
  wavesurfer: WaveSurfer,
  { isLooping, loopRegion, seconds }: SkipOptions
) {
  const loopStart = getLoopStart({ isLooping, loopRegion })
  if (loopStart !== null) {
    wavesurfer.setTime(loopStart)
    return
  }

  wavesurfer.skip(-seconds)
}

export function skipForward(
  wavesurfer: WaveSurfer,
  { isLooping, loopRegion, seconds }: SkipOptions
) {
  if (isLooping && loopRegion) {
    wavesurfer.setTime(Math.min(loopRegion.end, wavesurfer.getCurrentTime() + seconds))
    return
  }

  wavesurfer.skip(seconds)
}

export function syncLoopPlayback(
  wavesurfer: WaveSurfer,
  { isPlaying, isLooping, loopRegion }: LivePlaybackContext
) {
  if (!loopRegion) {
    if (isPlaying) {
      const currentTime = wavesurfer.getCurrentTime()
      wavesurfer.pause()
      return wavesurfer.play(currentTime)
    }

    return
  }

  if (isLooping) {
    if (isPlaying) {
      wavesurfer.pause()
      return wavesurfer.play(loopRegion.start, loopRegion.end)
    }

    wavesurfer.setTime(loopRegion.start)
    return
  }

  if (isPlaying) {
    const currentTime = wavesurfer.getCurrentTime()
    wavesurfer.pause()
    return wavesurfer.play(currentTime)
  }
}
