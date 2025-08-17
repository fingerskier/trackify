import { useState } from 'react'
import './App.css'
import { generateSong } from './midiGenerator'

function App() {
  const [form, setForm] = useState({
    genre: 'blues',
    key: 'C',
    timeSignature: '4/4',
    tempo: 120,
    style: '',
  })
  const [midiUrl, setMidiUrl] = useState(null)
  const [startPlayback, setStartPlayback] = useState(null)
  const [chordProgressions, setChordProgressions] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { url, start, chordProgressions: chords } = generateSong(form)
    setMidiUrl(url)
    setStartPlayback(() => start)
    setChordProgressions(chords)
  }

  return (
    <div className="App">
      <h1>Trackify</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Genre
          <select name="genre" value={form.genre} onChange={handleChange}>
            <option value="blues">Blues</option>
            <option value="rock">Rock</option>
            <option value="jazz">Jazz</option>
            <option value="folk">Folk</option>
            <option value="classical">Classical</option>
          </select>
        </label>
        <label>
          Key
          <select name="key" value={form.key} onChange={handleChange}>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
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
      {chordProgressions && (
        <div className="chords">
          <h2>Chord Progressions</h2>
          {Object.entries(chordProgressions).map(([section, chords]) => (
            <p key={section}>
              <strong>{section}:</strong> {chords.join(' - ')}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
