import { Volume2, VolumeX } from 'lucide-react'
import { useAudioStore } from '@/hooks/use-audio-store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function formatLoopRange(start: number, end: number) {
  return `${start.toFixed(2)}s - ${end.toFixed(2)}s`
}

export function TrackHeader() {
  const audioFileName = useAudioStore((s) => s.audioFileName)
  const isMuted = useAudioStore((s) => s.isMuted)
  const isLooping = useAudioStore((s) => s.isLooping)
  const isLoopEditing = useAudioStore((s) => s.isLoopEditing)
  const loopRegion = useAudioStore((s) => s.loopRegion)
  const toggleMute = useAudioStore((s) => s.toggleMute)

  return (
    <div className="flex w-[212px] min-w-[212px] flex-col border-r border-daw-border bg-[linear-gradient(180deg,rgba(34,38,44,0.98),rgba(22,24,28,0.98))]">
      <div className="h-[38px] min-h-[38px] border-b border-white/6 px-3 py-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-daw-text-dim">
          Track
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto border-b border-daw-border/30 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-daw-green">
              Audio Clip
            </div>
            <div className="pt-1 text-sm font-semibold leading-tight text-daw-text break-words">
              {audioFileName ?? 'Waiting for audio'}
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleMute}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  isMuted
                    ? 'border-daw-border-light bg-zinc-700/70 text-zinc-200'
                    : 'border-daw-green/55 bg-daw-green/15 text-daw-green shadow-[0_0_18px_rgba(0,204,102,0.18)]'
                }`}
                aria-label={isMuted ? 'Unmute track' : 'Mute track'}
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isMuted ? 'Unmute (M)' : 'Mute (M)'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="rounded-md border border-white/6 bg-black/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-mono uppercase tracking-[0.14em] text-daw-text-dim">
              Status
            </span>
            <span className="text-daw-text">
              {audioFileName ? 'Loaded' : 'Empty'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-mono uppercase tracking-[0.14em] text-daw-text-dim">
              Track
            </span>
            <span className="text-daw-text">Single audio lane</span>
          </div>
        </div>

        <div className="rounded-md border border-white/6 bg-black/20 px-3 py-2.5 text-[11px]">
          <div className="font-mono uppercase tracking-[0.14em] text-daw-text-dim">
            Loop
          </div>
          <div className="pt-1 text-daw-text">
            {loopRegion
              ? formatLoopRange(loopRegion.start, loopRegion.end)
              : 'No loop selected'}
          </div>
          <div className="pt-1 text-daw-text-dim">
            {isLoopEditing
              ? 'Drag across the waveform to define the loop range.'
              : isLooping && loopRegion
              ? 'Loop On is active. Play starts from the loop start and repeats.'
              : 'Use Set Loop, then drag on the waveform. Shift + drag also works.'}
          </div>
        </div>
      </div>
    </div>
  )
}
