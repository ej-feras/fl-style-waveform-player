import { useState, useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'

interface DropZoneProps {
  onFileDrop: (file: File) => void
  children: React.ReactNode
}

export function DropZone({ onFileDrop, children }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      dragCounter.current = 0

      const file = e.dataTransfer.files[0]
      if (!file) return

      if (!file.type.startsWith('audio/')) {
        setError('Please drop an audio file (MP3, WAV, OGG, etc.)')
        setTimeout(() => setError(null), 3000)
        return
      }

      setError(null)
      onFileDrop(file)
    },
    [onFileDrop]
  )

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/72 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-daw-green bg-[linear-gradient(180deg,rgba(0,0,0,0.62),rgba(15,20,18,0.9))] px-10 py-9 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <Upload className="h-10 w-10 text-daw-green" />
            <span className="text-lg font-medium text-daw-green">
              Drop audio file here
            </span>
            <span className="text-sm text-daw-text-dim">
              MP3, WAV, OGG, FLAC
            </span>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-900/90 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
