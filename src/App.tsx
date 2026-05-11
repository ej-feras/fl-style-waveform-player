import { DAWWorkstation } from '@/components/daw/daw-workstation'

function App() {
  return (
    <DAWWorkstation
      defaultBpm={140}
      onFileLoad={(file) => console.log('File loaded:', file.name)}
      onPlay={() => console.log('Playing')}
      onPause={() => console.log('Paused')}
    />
  )
}

export default App
