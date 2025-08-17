import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

export function generateSong({ genre, key, timeSignature, tempo, style }) {
  Tone.Transport.stop()
  Tone.Transport.cancel()

  const [beatsPerMeasure, beatUnit] = timeSignature.split('/').map(Number)
  const beatDuration = 60 / tempo

  Tone.Transport.bpm.value = tempo
  Tone.Transport.timeSignature = [beatsPerMeasure, beatUnit]

  const midi = new Midi()
  midi.name = `${genre} ${style}`
  midi.header.setTempo(tempo)
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: [beatsPerMeasure, beatUnit],
  })

  const synths = {
    drums: new Tone.PolySynth(Tone.Synth).toDestination(),
    bass: new Tone.PolySynth(Tone.Synth).toDestination(),
    keys: new Tone.PolySynth(Tone.Synth).toDestination(),
    guitar: new Tone.PolySynth(Tone.Synth).toDestination(),
  }

  const parts = {}
  const events = {
    drums: [],
    bass: [],
    keys: [],
    guitar: [],
  }

  const keyOffsets = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const keyOffset = keyOffsets[key] || 0

  const genreProgressions = {
    blues: [0, 0, 5, 0, 7, 5, 0],
    rock: [0, 5, 7, 0, 5, 7, 9],
    jazz: [0, 2, 7, 0],
    folk: [0, 5, 7, 9],
    classical: [0, 7, 9, 5],
  }

  const chordIntervals = {
    blues: [0, 3, 5],
    rock: [0, 4, 7],
    jazz: [0, 4, 7, 11],
    folk: [0, 4, 7],
    classical: [0, 4, 7],
  }

  const noteInKey = (semitone, octave) => {
    const base = `C${octave}`
    return Tone.Frequency(base).transpose(keyOffset + semitone).toNote()
  }

  const sections = ['intro', 'verse', 'chorus', 'bridge', 'outro']
  const measuresPerSection = 2
  let currentBeat = 0

  const progression = genreProgressions[genre] || [0, 5, 7]
  const intervals = chordIntervals[genre] || [0, 4, 7]

  const chordProgressions = {}

  sections.forEach((section) => {
    chordProgressions[section] = []
    for (let m = 0; m < measuresPerSection; m++) {
      const measureStart = currentBeat + m * beatsPerMeasure
      const rootSemitone =
        progression[Math.floor(Math.random() * progression.length)]
      const chordName = noteInKey(rootSemitone, 3).replace(/\d/g, '')
      chordProgressions[section].push(chordName)
      const chordNotes = intervals.map((i) => noteInKey(rootSemitone + i, 4))
      const chordNotesGtr = intervals.map((i) => noteInKey(rootSemitone + i, 3))

      for (let b = 0; b < beatsPerMeasure; b++) {
        const time = measureStart + b
        events.drums.push({ time, note: 'G3', duration: 1 })
        if (b === 0 || Math.random() < 0.2) {
          events.drums.push({ time, note: 'C3', duration: 1 })
        }
        if (b === Math.floor(beatsPerMeasure / 2)) {
          events.drums.push({ time, note: 'D3', duration: 1 })
        }
        if (Math.random() < 0.3) {
          events.drums.push({ time: time + 0.5, note: 'G3', duration: 0.5 })
        }
      }

      events.bass.push({
        time: measureStart,
        note: noteInKey(rootSemitone, 2),
        duration: beatsPerMeasure,
      })

      chordNotes.forEach((n) => {
        events.keys.push({
          time: measureStart,
          note: n,
          duration: beatsPerMeasure,
        })
      })

      for (let b = 0; b < beatsPerMeasure; b++) {
        const n =
          chordNotesGtr[Math.floor(Math.random() * chordNotesGtr.length)]
        events.guitar.push({ time: measureStart + b, note: n, duration: 1 })
      }
    }
    currentBeat += measuresPerSection * beatsPerMeasure
  })

  Object.keys(events).forEach((name) => {
    const evs = events[name]
    parts[name] = new Tone.Part(
      (time, value) => {
        synths[name].triggerAttackRelease(
          value.note,
          value.duration * beatDuration,
          time,
        )
      },
      evs.map((ev) => [ev.time * beatDuration, ev]),
    )
    parts[name].start(0)

    const track = midi.addTrack()
    evs.forEach((ev) => {
      track.addNote({
        midi: Tone.Frequency(ev.note).toMidi(),
        time: ev.time * beatDuration,
        duration: ev.duration * beatDuration,
      })
    })
  })

  const start = async () => {
    await Tone.start()
    Tone.Transport.start()
  }

  const blob = new Blob([midi.toArray()], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)

  return { url, start, chordProgressions }
}
