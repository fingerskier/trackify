import { useState } from 'react'
import './App.css'
import { generateSong } from './midiGenerator'

function App() {
  const [form, setForm] = useState({
    genre: '',
    timeSignature: '4/4',
    tempo: 120,
    style: '',
  })
  const [midiUrl, setMidiUrl] = useState(null)
  const [startPlayback, setStartPlayback] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { url, start } = generateSong(form)
    setMidiUrl(url)
    setStartPlayback(() => start)
  }

  return (
    <div className="App">
      <h1>Trackify</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Genre
          <input name="genre" value={form.genre} onChange={handleChange} />
        </label>
        <label>
          Time Signature
          <input
            name="timeSignature"
            value={form.timeSignature}
            onChange={handleChange}
          />
        </label>
        <label>
          Tempo
          <input
            type="number"
            name="tempo"
            value={form.tempo}
            onChange={handleChange}
          />
        </label>
        <label>
          Style
          <input name="style" value={form.style} onChange={handleChange} />
        </label>
        <button type="submit">Create Song</button>
      </form>
      {startPlayback && (
        <div className="actions">
          <button onClick={startPlayback}>Play</button>
          {midiUrl && (
            <a href={midiUrl} download="song.mid">
              Download MIDI
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default App
