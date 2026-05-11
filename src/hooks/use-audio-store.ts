import { create } from 'zustand'
import { DEFAULT_ZOOM } from '@/lib/constants'

export interface LoopRegion {
  start: number
  end: number
}

interface ViewportMetrics {
  scrollLeft: number
  viewportWidth: number
  contentWidth: number
  visibleStart: number
  visibleEnd: number
}

interface AudioState {
  // Playback
  isPlaying: boolean
  currentTime: number
  duration: number

  // Volume
  volume: number
  isMuted: boolean
  previousVolume: number

  // Zoom
  zoomLevel: number

  // Loop
  loopRegion: LoopRegion | null
  isLooping: boolean
  isLoopEditing: boolean

  // File
  audioFile: File | null
  audioFileName: string | null
  isFileLoaded: boolean

  // Viewport
  viewport: ViewportMetrics

  // Actions
  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setZoomLevel: (zoom: number) => void
  setLoopRegion: (region: LoopRegion | null) => void
  setIsLooping: (looping: boolean) => void
  setIsLoopEditing: (editing: boolean) => void
  beginAudioLoad: (file: File) => void
  setAudioFile: (file: File) => void
  clearAudioFile: () => void
  setIsFileLoaded: (loaded: boolean) => void
  setViewport: (viewport: Partial<ViewportMetrics>) => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  volume: 0.8,
  isMuted: false,
  previousVolume: 0.8,

  zoomLevel: DEFAULT_ZOOM,

  loopRegion: null,
  isLooping: false,
  isLoopEditing: false,

  audioFile: null,
  audioFileName: null,
  isFileLoaded: false,
  viewport: {
    scrollLeft: 0,
    viewportWidth: 0,
    contentWidth: 0,
    visibleStart: 0,
    visibleEnd: 0,
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),

  setVolume: (volume) =>
    set((state) => {
      const nextVolume = Math.max(0, Math.min(1, volume))
      return {
        volume: nextVolume,
        isMuted: nextVolume === 0,
        previousVolume:
          nextVolume > 0 ? nextVolume : Math.max(state.previousVolume, 0.05),
      }
    }),
  toggleMute: () => {
    const { isMuted, previousVolume, volume } = get()
    if (isMuted || volume === 0) {
      set({
        isMuted: false,
        volume: previousVolume || 0.8,
      })
    } else {
      set({
        isMuted: true,
        previousVolume: volume,
        volume: 0,
      })
    }
  },

  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  setLoopRegion: (region) =>
    set((state) => ({
      loopRegion: region,
      isLooping: region ? state.isLooping : false,
    })),
  setIsLooping: (looping) => set({ isLooping: looping }),
  setIsLoopEditing: (editing) => set({ isLoopEditing: editing }),

  beginAudioLoad: (file) =>
    set((state) => ({
      audioFile: file,
      audioFileName: file.name.replace(/\.[^/.]+$/, ''),
      isFileLoaded: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      loopRegion: null,
      isLooping: false,
      isLoopEditing: false,
      viewport: {
        scrollLeft: 0,
        viewportWidth: 0,
        contentWidth: 0,
        visibleStart: 0,
        visibleEnd: 0,
      },
      previousVolume:
        state.volume > 0 ? state.volume : Math.max(state.previousVolume, 0.05),
    })),

  setAudioFile: (file) =>
    set({
      audioFile: file,
      audioFileName: file.name.replace(/\.[^/.]+$/, ''),
      isFileLoaded: false,
      currentTime: 0,
      duration: 0,
    }),
  clearAudioFile: () =>
    set({
      audioFile: null,
      audioFileName: null,
      isFileLoaded: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      loopRegion: null,
      isLooping: false,
      isLoopEditing: false,
      viewport: {
        scrollLeft: 0,
        viewportWidth: 0,
        contentWidth: 0,
        visibleStart: 0,
        visibleEnd: 0,
      },
    }),
  setIsFileLoaded: (loaded) => set({ isFileLoaded: loaded }),
  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),
}))
