import { useRef } from 'react'
import { MoveHorizontal, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import type WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAudioStore } from '@/hooks/use-audio-store'
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants'

interface ToolbarProps {
  onFileSelect: (file: File) => void
  wavesurferRef: React.RefObject<WaveSurfer | null>
}

function formatViewportTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0.00'
  return seconds.toFixed(2)
}

function formatLoopHint(
  isLoopEditing: boolean,
  isLooping: boolean,
  loopRegion: { start: number; end: number } | null
) {
  if (isLoopEditing) {
    return 'Set Loop is active. Drag on the waveform to mark the loop start and end.'
  }

  if (!loopRegion) {
    return 'Click Set Loop, then drag on the waveform. Shift + drag works as a shortcut.'
  }

  const label = `${loopRegion.start.toFixed(2)}s - ${loopRegion.end.toFixed(2)}s`
  return isLooping
    ? `Loop On: playback starts from ${loopRegion.start.toFixed(2)}s and repeats to ${loopRegion.end.toFixed(2)}s.`
    : `Loop range saved: ${label}`
}

export function Toolbar({ onFileSelect, wavesurferRef }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollBarRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScroll = useRef(0)

  const zoomLevel = useAudioStore((s) => s.zoomLevel)
  const setZoomLevel = useAudioStore((s) => s.setZoomLevel)
  const duration = useAudioStore((s) => s.duration)
  const audioFileName = useAudioStore((s) => s.audioFileName)
  const isFileLoaded = useAudioStore((s) => s.isFileLoaded)
  const isLoopEditing = useAudioStore((s) => s.isLoopEditing)
  const isLooping = useAudioStore((s) => s.isLooping)
  const loopRegion = useAudioStore((s) => s.loopRegion)
  const viewport = useAudioStore((s) => s.viewport)

  const contentWidth = Math.max(
    viewport.contentWidth,
    viewport.viewportWidth,
    duration * zoomLevel
  )
  const maxScroll = Math.max(contentWidth - viewport.viewportWidth, 0)
  const showThumb = maxScroll > 1
  const thumbWidth = showThumb
    ? Math.max((viewport.viewportWidth / contentWidth) * 100, 10)
    : 100
  const thumbLeft = showThumb
    ? (viewport.scrollLeft / maxScroll) * (100 - thumbWidth)
    : 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file)
    }
    e.target.value = ''
  }

  const handleScrollBarClick = (e: React.MouseEvent) => {
    if (!scrollBarRef.current || !showThumb) return

    const rect = scrollBarRef.current.getBoundingClientRect()
    const clickRatio = (e.clientX - rect.left) / rect.width
    wavesurferRef.current?.setScroll(clickRatio * maxScroll)
  }

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    if (!showThumb) return

    e.stopPropagation()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartScroll.current = viewport.scrollLeft

    const handleMove = (event: MouseEvent) => {
      if (!isDragging.current || !scrollBarRef.current) return

      const dx = event.clientX - dragStartX.current
      const ratio = dx / scrollBarRef.current.clientWidth
      wavesurferRef.current?.setScroll(
        Math.max(0, Math.min(maxScroll, dragStartScroll.current + ratio * maxScroll))
      )
    }

    const handleUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const handleScrollWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel * delta)))
  }

  return (
    <div className="border-b border-daw-border bg-[linear-gradient(180deg,rgba(43,47,54,0.98),rgba(19,21,24,0.98))]">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-sm border border-daw-border-light bg-black/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-daw-green">
            Playlist
          </div>
          <div className="min-w-0 space-y-1">
            <div className="truncate text-sm font-semibold text-daw-text">
              {audioFileName ?? 'Drop a beat to begin'}
            </div>
            <div className="text-[11px] leading-tight text-daw-text-dim">
              {formatLoopHint(isLoopEditing, isLooping, loopRegion)}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-sm border border-white/6 bg-black/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-daw-text-dim lg:flex">
          <span>View {formatViewportTime(viewport.visibleStart)}s</span>
          <MoveHorizontal className="h-3 w-3 text-daw-green" />
          <span>{formatViewportTime(viewport.visibleEnd)}s</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 gap-1.5 border-daw-border-light bg-black/20 text-daw-text hover:border-daw-green/50 hover:bg-daw-light"
            >
              <Upload className="h-3.5 w-3.5" />
              Open Audio
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Upload an audio file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoomLevel(Math.max(MIN_ZOOM, zoomLevel / 1.3))}
              className="shrink-0 text-daw-text-dim hover:text-daw-green"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Zoom Out</TooltipContent>
        </Tooltip>

        <div className="flex shrink-0 items-center gap-2 rounded-sm border border-daw-border bg-black/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-daw-text-dim">
          <span className="text-daw-text">Zoom</span>
          <span className="text-daw-green">{Math.round(zoomLevel)} px/s</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoomLevel(Math.min(MAX_ZOOM, zoomLevel * 1.3))}
              className="shrink-0 text-daw-text-dim hover:text-daw-green"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Zoom In</TooltipContent>
        </Tooltip>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            ref={scrollBarRef}
            className={`relative h-7 flex-1 overflow-hidden rounded-sm border border-daw-border bg-black/35 ${showThumb ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={handleScrollBarClick}
            onWheel={handleScrollWheel}
          >
            <div className="absolute inset-y-0 left-0 right-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:16px_100%] opacity-40" />
            <div className="absolute inset-y-[4px] left-[4px] right-[4px] rounded-[3px] border border-white/5 bg-black/25" />
            {showThumb && (
              <div
                className="absolute top-[5px] h-[16px] rounded-[3px] border border-daw-green/50 bg-[linear-gradient(180deg,rgba(0,204,102,0.42),rgba(0,122,69,0.58))] shadow-[0_0_0_1px_rgba(0,0,0,0.28),0_6px_18px_rgba(0,0,0,0.24)] transition-colors hover:border-daw-green/70 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${thumbLeft}%`,
                  width: `${thumbWidth}%`,
                }}
                onMouseDown={handleThumbMouseDown}
              />
            )}
          </div>

          <div className="hidden shrink-0 rounded-sm border border-daw-border bg-black/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-daw-text-dim md:block">
            {isFileLoaded ? `${duration.toFixed(2)}s loaded` : 'Awaiting file'}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
