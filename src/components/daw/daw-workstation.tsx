import { useRef, useCallback, useEffect } from 'react'
import WaveSurfer from 'wavesurfer.js'
import type RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toolbar } from './toolbar'
import { TrackHeader } from './track-header'
import { WaveformDisplay } from './waveform-display'
import { TransportControls } from './transport-controls'
import { DropZone } from './drop-zone'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useAudioStore } from '@/hooks/use-audio-store'
import { cn } from '@/lib/utils'

export interface DAWWorkstationProps {
  onFileLoad?: (file: File) => void
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (time: number) => void
  onLoopChange?: (region: { start: number; end: number } | null) => void
  onVolumeChange?: (volume: number) => void
  defaultBpm?: number
  className?: string
}

export function DAWWorkstation({
  onFileLoad,
  onPlay,
  onPause,
  onTimeUpdate,
  onLoopChange,
  onVolumeChange,
  defaultBpm = 140,
  className,
}: DAWWorkstationProps) {
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)

  useKeyboardShortcuts(wavesurferRef)

  useEffect(() => {
    const unsub = useAudioStore.subscribe((state, prev) => {
      if (state.isPlaying !== prev.isPlaying) {
        if (state.isPlaying) onPlay?.()
        else onPause?.()
      }
      if (state.currentTime !== prev.currentTime) {
        onTimeUpdate?.(state.currentTime)
      }
      if (state.loopRegion !== prev.loopRegion) {
        onLoopChange?.(state.loopRegion)
      }
      if (state.volume !== prev.volume) {
        onVolumeChange?.(state.volume)
      }
    })
    return unsub
  }, [onPlay, onPause, onTimeUpdate, onLoopChange, onVolumeChange])

  const handleFileLoad = useCallback(
    (file: File) => {
      const ws = wavesurferRef.current
      if (!ws) return

      const audioState = useAudioStore.getState()
      audioState.beginAudioLoad(file)

      ws.stop()
      ws.setScroll(0)

      if (regionsRef.current) {
        regionsRef.current.getRegions().forEach((r) => r.remove())
      }

      void ws.loadBlob(file)

      onFileLoad?.(file)
    },
    [onFileLoad]
  )

  return (
    <TooltipProvider delayDuration={300}>
      <DropZone onFileDrop={handleFileLoad}>
        <div
          className={cn(
            'flex h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,63,75,0.35),transparent_28%),linear-gradient(180deg,#181b20,#0d0f12_46%,#090a0c)] text-daw-text select-none',
            className
          )}
        >
          <div className="border-b border-white/5 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-daw-green">
                  FL-style Audio Workstation
                </div>
                <div className="pt-1 text-lg font-semibold text-white">
                  Single-track waveform player
                </div>
              </div>

              <div className="max-w-[520px] rounded-md border border-white/8 bg-black/20 px-3 py-2 text-left sm:text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-daw-text-dim">
                  Session
                </div>
                <div className="pt-1 text-sm leading-tight text-daw-text">
                  {defaultBpm} BPM grid with timeline, loop selection, transport, mute, zoom, and drag-drop upload.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 flex-col px-4 py-4">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/20 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur">
              <Toolbar onFileSelect={handleFileLoad} wavesurferRef={wavesurferRef} />

              <div className="flex min-h-0 flex-1 overflow-hidden">
                <TrackHeader />
                <WaveformDisplay
                  wavesurferRef={wavesurferRef}
                  regionsRef={regionsRef}
                  bpm={defaultBpm}
                />
              </div>
            </div>
          </div>

          <TransportControls wavesurferRef={wavesurferRef} />
        </div>
      </DropZone>
    </TooltipProvider>
  )
}
