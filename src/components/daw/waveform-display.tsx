import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, {
  type Region,
} from 'wavesurfer.js/dist/plugins/regions.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import { useAudioStore } from '@/hooks/use-audio-store'
import { DAW_COLORS, DEFAULT_BPM, DEFAULT_ZOOM } from '@/lib/constants'
import { syncLoopPlayback } from '@/lib/audio-controls'

interface WaveformDisplayProps {
  wavesurferRef: React.MutableRefObject<WaveSurfer | null>
  regionsRef: React.MutableRefObject<RegionsPlugin | null>
  bpm?: number
}

interface DraftLoop {
  startTime: number
  endTime: number
}

const LOOP_MIN_LENGTH = 0.08

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatLoopBadge(region: { start: number; end: number }) {
  return `${region.start.toFixed(2)}s - ${region.end.toFixed(2)}s`
}

export function WaveformDisplay({
  wavesurferRef,
  regionsRef,
  bpm = DEFAULT_BPM,
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRegionRef = useRef<Region | null>(null)
  const draftStartTimeRef = useRef<number | null>(null)
  const previousLoopStateRef = useRef<{
    isLooping: boolean
    start: number | null
    end: number | null
  }>({
    isLooping: false,
    start: null,
    end: null,
  })
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [draftLoop, setDraftLoop] = useState<DraftLoop | null>(null)

  const setPlaying = useAudioStore((s) => s.setPlaying)
  const setCurrentTime = useAudioStore((s) => s.setCurrentTime)
  const setDuration = useAudioStore((s) => s.setDuration)
  const setIsFileLoaded = useAudioStore((s) => s.setIsFileLoaded)
  const setLoopRegion = useAudioStore((s) => s.setLoopRegion)
  const setIsLooping = useAudioStore((s) => s.setIsLooping)
  const setIsLoopEditing = useAudioStore((s) => s.setIsLoopEditing)
  const setViewport = useAudioStore((s) => s.setViewport)
  const zoomLevel = useAudioStore((s) => s.zoomLevel)
  const audioFileName = useAudioStore((s) => s.audioFileName)
  const isFileLoaded = useAudioStore((s) => s.isFileLoaded)
  const volume = useAudioStore((s) => s.volume)
  const loopRegion = useAudioStore((s) => s.loopRegion)
  const isLooping = useAudioStore((s) => s.isLooping)
  const isLoopEditing = useAudioStore((s) => s.isLoopEditing)
  const isPlaying = useAudioStore((s) => s.isPlaying)
  const duration = useAudioStore((s) => s.duration)
  const viewport = useAudioStore((s) => s.viewport)

  const isSelectingLoop = isLoopEditing || isShiftPressed
  const pixelsPerSecond =
    duration > 0 && viewport.contentWidth > 0
      ? viewport.contentWidth / duration
      : zoomLevel
  const beatWidth = pixelsPerSecond * (60 / bpm)
  const barWidth = beatWidth * 4
  const barDuration = (4 * 60) / bpm

  useEffect(() => {
    if (!containerRef.current) return

    const regions = RegionsPlugin.create()
    const timeline = TimelinePlugin.create({
      height: 38,
      insertPosition: 'beforebegin',
      timeInterval: 60 / bpm,
      primaryLabelSpacing: 4,
      secondaryLabelSpacing: 1,
      secondaryLabelOpacity: 0.35,
      formatTimeCallback: (seconds: number) => {
        const bar = Math.floor(seconds / barDuration) + 1
        return String(bar)
      },
      style: {
        fontSize: '11px',
        color: DAW_COLORS.textSecondary,
        background:
          'linear-gradient(180deg, rgba(18, 20, 24, 0.95), rgba(12, 14, 16, 0.95))',
        borderBottom: `1px solid ${DAW_COLORS.border}`,
      },
    })

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: DAW_COLORS.waveformBase,
      progressColor: DAW_COLORS.waveformProgress,
      cursorColor: DAW_COLORS.cursorOrange,
      cursorWidth: 2,
      height: 210,
      barWidth: 2,
      barGap: 1.5,
      barRadius: 2,
      barMinHeight: 1,
      normalize: true,
      minPxPerSec: DEFAULT_ZOOM,
      backend: 'WebAudio',
      autoCenter: true,
      autoScroll: true,
      dragToSeek: true,
      fillParent: true,
      plugins: [regions, timeline],
    })

    wavesurferRef.current = ws
    regionsRef.current = regions

    const syncViewportFromDom = () => {
      const wrapper = ws.getWrapper()
      const scrollLeft = wrapper.scrollLeft
      const viewportWidth = wrapper.clientWidth
      const contentWidth = wrapper.scrollWidth
      const totalDuration = ws.getDuration()

      const visibleStart =
        contentWidth > 0 ? (scrollLeft / contentWidth) * totalDuration : 0
      const visibleEnd =
        contentWidth > 0
          ? ((scrollLeft + viewportWidth) / contentWidth) * totalDuration
          : totalDuration

      setViewport({
        scrollLeft,
        viewportWidth,
        contentWidth,
        visibleStart,
        visibleEnd,
      })
    }

    const wrapper = ws.getWrapper()
    wrapper.style.background = 'transparent'
    wrapper.style.outline = 'none'
    wrapper.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)'

    ws.setVolume(useAudioStore.getState().volume)

    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('timeupdate', (time) => setCurrentTime(time))
    ws.on('decode', (decodedDuration) => {
      setDuration(decodedDuration)
      setIsFileLoaded(true)
      requestAnimationFrame(syncViewportFromDom)
    })
    ws.on('ready', () => requestAnimationFrame(syncViewportFromDom))
    ws.on('redrawcomplete', () => requestAnimationFrame(syncViewportFromDom))
    ws.on('zoom', () => requestAnimationFrame(syncViewportFromDom))
    ws.on('resize', () => requestAnimationFrame(syncViewportFromDom))
    ws.on('scroll', (visibleStart, visibleEnd, scrollLeft, scrollRight) => {
      setViewport({
        scrollLeft,
        viewportWidth: scrollRight - scrollLeft,
        contentWidth: ws.getWrapper().scrollWidth,
        visibleStart,
        visibleEnd,
      })
    })
    ws.on('interaction', () => {
      if (ws.getCurrentTime() > 0) {
        setCurrentTime(ws.getCurrentTime())
      }
    })
    ws.on('finish', () => {
      const state = useAudioStore.getState()
      if (state.isLooping && state.loopRegion) {
        void ws.play(state.loopRegion.start, state.loopRegion.end)
        return
      }

      setPlaying(false)
    })

    regions.on('region-updated', (region) => {
      activeRegionRef.current = region
      setLoopRegion({
        start: clamp(region.start, 0, ws.getDuration()),
        end: clamp(region.end, 0, ws.getDuration()),
      })
    })

    regions.on('region-removed', (region) => {
      if (activeRegionRef.current?.id !== region.id) return
      activeRegionRef.current = null
      setLoopRegion(null)
      setIsLoopEditing(false)
    })

    regions.on('region-clicked', (region, event) => {
      event.stopPropagation()
      ws.setTime(region.start)
    })

    regions.on('region-double-clicked', (region, event) => {
      event.preventDefault()
      region.remove()
      setIsLooping(false)
      setIsLoopEditing(false)
    })

    const handleShiftDown = (event: KeyboardEvent) => {
      if (event.key !== 'Shift') return
      setIsShiftPressed(true)
    }

    const handleShiftUp = (event: KeyboardEvent) => {
      if (event.key !== 'Shift') return
      setIsShiftPressed(false)
      draftStartTimeRef.current = null
      setDraftLoop(null)
    }

    window.addEventListener('keydown', handleShiftDown)
    window.addEventListener('keyup', handleShiftUp)

    return () => {
      window.removeEventListener('keydown', handleShiftDown)
      window.removeEventListener('keyup', handleShiftUp)
      ws.destroy()
      wavesurferRef.current = null
      regionsRef.current = null
      activeRegionRef.current = null
      draftStartTimeRef.current = null
    }
  }, [
    bpm,
    barDuration,
    regionsRef,
    setCurrentTime,
    setDuration,
    setIsFileLoaded,
    setIsLoopEditing,
    setIsLooping,
    setLoopRegion,
    setPlaying,
    setViewport,
    wavesurferRef,
  ])

  useEffect(() => {
    const ws = wavesurferRef.current
    if (ws && isFileLoaded) {
      try {
        ws.zoom(zoomLevel)
      } catch {
        // Ignore zoom attempts while a new file is still decoding.
      }
    }
  }, [zoomLevel, wavesurferRef, isFileLoaded])

  useEffect(() => {
    wavesurferRef.current?.setVolume(volume)
  }, [volume, wavesurferRef])

  useEffect(() => {
    if (isFileLoaded) return

    activeRegionRef.current = null
    draftStartTimeRef.current = null
    previousLoopStateRef.current = {
      isLooping: false,
      start: null,
      end: null,
    }

    if (draftLoop !== null) {
      const frameId = window.requestAnimationFrame(() => setDraftLoop(null))
      return () => window.cancelAnimationFrame(frameId)
    }
  }, [draftLoop, isFileLoaded])

  useEffect(() => {
    if (!loopRegion && regionsRef.current) {
      regionsRef.current.getRegions().forEach((region) => region.remove())
      activeRegionRef.current = null
    }
  }, [loopRegion, regionsRef])

  useEffect(() => {
    const ws = wavesurferRef.current
    if (!ws || !isFileLoaded) return

    const previous = previousLoopStateRef.current
    const current = {
      isLooping,
      start: loopRegion?.start ?? null,
      end: loopRegion?.end ?? null,
    }

    const didChange =
      previous.isLooping !== current.isLooping ||
      previous.start !== current.start ||
      previous.end !== current.end

    previousLoopStateRef.current = current

    if (!didChange) return

    const loopStateChanged = previous.isLooping !== current.isLooping
    const loopBoundsChanged =
      previous.start !== current.start || previous.end !== current.end

    const shouldResyncPlayback =
      loopStateChanged || (loopBoundsChanged && isLooping)

    if (!shouldResyncPlayback) return

    void syncLoopPlayback(ws, {
      isPlaying,
      isLooping,
      loopRegion,
    })
  }, [isFileLoaded, isLooping, isPlaying, loopRegion, wavesurferRef])

  const getTimeFromClientX = (clientX: number) => {
    const ws = wavesurferRef.current
    if (!ws) return 0

    const wrapper = ws.getWrapper()
    const rect = wrapper.getBoundingClientRect()
    const absoluteX = clientX - rect.left + wrapper.scrollLeft
    const progress = clamp(
      wrapper.scrollWidth > 0 ? absoluteX / wrapper.scrollWidth : 0,
      0,
      1
    )

    return progress * ws.getDuration()
  }

  const handleLoopPointerDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isFileLoaded || !isSelectingLoop || !wavesurferRef.current) return

    event.preventDefault()
    event.stopPropagation()

    const startTime = getTimeFromClientX(event.clientX)
    draftStartTimeRef.current = startTime
    setDraftLoop({ startTime, endTime: startTime })

    const handleMove = (moveEvent: MouseEvent) => {
      if (draftStartTimeRef.current === null) return

      const currentTime = getTimeFromClientX(moveEvent.clientX)
      setDraftLoop({
        startTime: Math.min(draftStartTimeRef.current, currentTime),
        endTime: Math.max(draftStartTimeRef.current, currentTime),
      })
    }

    const handleUp = (upEvent: MouseEvent) => {
      const start = draftStartTimeRef.current
      const end = getTimeFromClientX(upEvent.clientX)

      draftStartTimeRef.current = null
      setDraftLoop(null)

      if (start !== null && Math.abs(end - start) >= LOOP_MIN_LENGTH) {
        const loopStart = Math.min(start, end)
        const loopEnd = Math.max(start, end)

        const ws = wavesurferRef.current
        if (ws && regionsRef.current) {
          regionsRef.current.getRegions().forEach((region) => region.remove())
          const region = regionsRef.current.addRegion({
            start: loopStart,
            end: loopEnd,
            color: DAW_COLORS.regionFill,
            content: 'LOOP',
            contentEditable: false,
            drag: true,
            resize: true,
            resizeStart: true,
            resizeEnd: true,
            minLength: LOOP_MIN_LENGTH,
          })

          activeRegionRef.current = region
          setLoopRegion({ start: loopStart, end: loopEnd })
          setIsLooping(true)
          setIsLoopEditing(false)
          ws.setTime(loopStart)
        }
      } else if (!isShiftPressed) {
        setIsLoopEditing(false)
      }

      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  const draftLoopStyle = (() => {
    if (!draftLoop || duration <= 0 || viewport.contentWidth <= 0) return null

    const left =
      draftLoop.startTime * pixelsPerSecond - viewport.scrollLeft
    const width =
      Math.max(draftLoop.endTime - draftLoop.startTime, 0) * pixelsPerSecond

    return {
      left,
      width,
    }
  })()

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(21,24,29,0.98),rgba(12,14,16,0.98))]">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[39px] z-0"
        style={{
          backgroundImage: `
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.12)),
            repeating-linear-gradient(90deg, transparent, transparent ${Math.max(beatWidth - 1, 0)}px, rgba(255,255,255,0.05) ${Math.max(beatWidth - 1, 0)}px, rgba(255,255,255,0.05) ${Math.max(beatWidth, 1)}px),
            repeating-linear-gradient(90deg, transparent, transparent ${Math.max(barWidth - 1, 0)}px, rgba(255,255,255,0.14) ${Math.max(barWidth - 1, 0)}px, rgba(255,255,255,0.14) ${Math.max(barWidth, 1)}px)
          `,
          backgroundPositionX: `0px, ${-viewport.scrollLeft}px, ${-viewport.scrollLeft}px`,
        }}
      />

      <div className="pointer-events-none absolute left-3 right-3 top-[48px] z-20 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {audioFileName && (
            <div className="max-w-[320px] truncate rounded-sm border border-daw-green/35 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-daw-green shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
              {audioFileName}
            </div>
          )}

          {loopRegion && (
            <div className="rounded-sm border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-daw-text-dim">
              {isLooping
                ? `Loop armed ${formatLoopBadge(loopRegion)}`
                : `Loop saved ${formatLoopBadge(loopRegion)}`}
            </div>
          )}
        </div>

        {isSelectingLoop && (
          <div className="shrink-0 rounded-sm border border-daw-orange/35 bg-black/35 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-daw-orange">
            Drag to set loop start and end
          </div>
        )}
      </div>

      {!isFileLoaded && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-xl border border-daw-border-light bg-black/45 px-6 py-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-daw-green">
              Audio Lane
            </div>
            <div className="pt-2 text-base font-semibold text-daw-text">
              Drag and drop a beat here
            </div>
            <div className="pt-1 text-sm text-daw-text-dim">
              Supports WAV, MP3, OGG, FLAC and other browser-safe audio formats.
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative z-10 flex-1"
      />

      <div
        className={`absolute inset-x-0 bottom-0 top-[39px] z-30 ${
          isSelectingLoop && isFileLoaded ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          cursor: isSelectingLoop && isFileLoaded ? 'crosshair' : 'default',
        }}
        onMouseDown={handleLoopPointerDown}
      >
        {draftLoopStyle && (
          <div
            className="absolute bottom-0 top-0 border border-daw-orange/60 bg-daw-orange/12 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]"
            style={draftLoopStyle}
          />
        )}
      </div>
    </div>
  )
}
