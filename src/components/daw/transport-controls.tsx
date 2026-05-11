import {
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Scissors,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAudioStore } from '@/hooks/use-audio-store'
import { SKIP_SECONDS } from '@/lib/constants'
import {
  playAudio,
  replayLoop,
  skipBackward,
  skipForward,
  stopAudio,
} from '@/lib/audio-controls'
import { cn } from '@/lib/utils'

interface TransportControlsProps {
  wavesurferRef: React.RefObject<WaveSurfer | null>
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export function TransportControls({ wavesurferRef }: TransportControlsProps) {
  const isPlaying = useAudioStore((s) => s.isPlaying)
  const currentTime = useAudioStore((s) => s.currentTime)
  const duration = useAudioStore((s) => s.duration)
  const isFileLoaded = useAudioStore((s) => s.isFileLoaded)
  const volume = useAudioStore((s) => s.volume)
  const isMuted = useAudioStore((s) => s.isMuted)
  const isLooping = useAudioStore((s) => s.isLooping)
  const loopRegion = useAudioStore((s) => s.loopRegion)
  const isLoopEditing = useAudioStore((s) => s.isLoopEditing)
  const setVolume = useAudioStore((s) => s.setVolume)
  const toggleMute = useAudioStore((s) => s.toggleMute)
  const setIsLooping = useAudioStore((s) => s.setIsLooping)
  const setIsLoopEditing = useAudioStore((s) => s.setIsLoopEditing)
  const setLoopRegion = useAudioStore((s) => s.setLoopRegion)

  const playbackState = { isLooping, loopRegion }

  const handlePlayPause = () => {
    const ws = wavesurferRef.current
    if (!ws) return

    if (isPlaying) {
      ws.pause()
      return
    }

    void playAudio(ws, playbackState)
  }

  const handleStop = () => {
    const ws = wavesurferRef.current
    if (!ws) return
    stopAudio(ws, playbackState)
  }

  const handleSkipBack = () => {
    const ws = wavesurferRef.current
    if (!ws) return
    skipBackward(ws, { ...playbackState, seconds: SKIP_SECONDS })
  }

  const handleSkipForward = () => {
    const ws = wavesurferRef.current
    if (!ws) return
    skipForward(ws, { ...playbackState, seconds: SKIP_SECONDS })
  }

  const handleReplayLoop = () => {
    const ws = wavesurferRef.current
    if (!ws) return
    void replayLoop(ws, playbackState)
  }

  const handleClearLoop = () => {
    setLoopRegion(null)
    setIsLooping(false)
    setIsLoopEditing(false)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
  }

  const loopEditButtonClass = cn(
    'gap-1.5 border px-2',
    isLoopEditing
      ? 'border-daw-orange/55 bg-daw-orange/12 text-daw-orange hover:bg-daw-orange/18'
      : 'border-daw-border bg-transparent text-daw-text-dim hover:border-daw-border-light hover:bg-daw-light/40 hover:text-daw-text'
  )

  const loopButtonClass = cn(
    'gap-1.5 border px-2',
    isLooping
      ? 'border-daw-green/55 bg-daw-green/14 text-daw-green hover:bg-daw-green/18'
      : 'border-daw-border bg-transparent text-daw-text-dim hover:border-daw-border-light hover:bg-daw-light/40 hover:text-daw-text'
  )

  return (
    <div className="border-t border-daw-border bg-[linear-gradient(180deg,rgba(25,27,31,0.98),rgba(15,16,18,0.98))] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-daw-border bg-black/25 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleSkipBack}>
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back {SKIP_SECONDS}s</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                onClick={handlePlayPause}
                className="bg-daw-green text-black hover:bg-daw-green/90"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStop}
                className="text-daw-text hover:text-daw-orange"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop (Esc)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleSkipForward}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward {SKIP_SECONDS}s</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-daw-border bg-black/25 p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLoopEditing(!isLoopEditing)}
                className={loopEditButtonClass}
                disabled={!isFileLoaded}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isLoopEditing ? 'bg-daw-orange' : 'bg-daw-border-light'
                  )}
                />
                <Scissors className="h-4 w-4" />
                <span className="text-[11px]">
                  {isLoopEditing ? 'Setting Loop' : 'Set Loop'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Set loop, then drag on waveform</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!loopRegion) return
                  setIsLooping(!isLooping)
                }}
                className={loopButtonClass}
                disabled={!loopRegion}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isLooping ? 'bg-daw-green' : 'bg-daw-border-light'
                  )}
                />
                <Repeat className="h-4 w-4" />
                <span className="text-[11px]">
                  {isLooping ? 'Loop On' : 'Loop Off'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle playback looping for the selected range</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplayLoop}
                disabled={!loopRegion}
                className="gap-1.5 px-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-[11px]">Restart</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Jump back to the loop start (R)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLoop}
                disabled={!loopRegion}
                className="gap-1.5 px-2"
              >
                <X className="h-3.5 w-3.5" />
                <span className="text-[11px]">Clear</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear loop</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="hidden h-8 sm:block" />

        <div className="flex min-w-[180px] flex-1 items-center gap-2 sm:max-w-[260px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mute (M)</TooltipContent>
          </Tooltip>

          <Slider
            min={0}
            max={100}
            step={1}
            value={[Math.round(volume * 100)]}
            onValueChange={handleVolumeChange}
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="rounded-md border border-daw-border bg-black/25 px-3 py-2 font-mono text-[11px] tracking-wider text-daw-text-dim">
            <span className="text-daw-green">{formatTime(currentTime)}</span>
            <span className="mx-1 text-daw-border-light">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="rounded-md border border-daw-border bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-daw-text-dim">
            {isLoopEditing
              ? 'Drag on waveform to set loop'
              : loopRegion
                ? `Loop ${formatTime(loopRegion.start)} - ${formatTime(loopRegion.end)}`
                : 'No loop selected'}
          </div>
        </div>
      </div>
    </div>
  )
}
