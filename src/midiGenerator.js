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

  const weightedChords = [
    { semitone: 0, weight: 7 }, // I
    { semitone: 7, weight: 6 }, // V
    { semitone: 5, weight: 5 }, // IV
    { semitone: 9, weight: 4 }, // VI
    { semitone: 2, weight: 3 }, // II
    { semitone: 4, weight: 2 }, // III
    { semitone: 11, weight: 1 }, // VII
  ]

  const pickChordRoot = () => {
    const total = weightedChords.reduce((sum, c) => sum + c.weight, 0)
    let r = Math.random() * total
    for (const c of weightedChords) {
      if (r < c.weight) return c.semitone
      r -= c.weight
    }
    return weightedChords[0].semitone
  }

  const sections = ['intro', 'verse', 'chorus', 'bridge', 'outro']
  let currentBeat = 0

  const intervals = chordIntervals[genre] || [0, 4, 7]

  const chordProgressions = {}

  sections.forEach((section) => {
    const chordsInSection = Math.floor(Math.random() * 5) + 2
    chordProgressions[section] = []
    for (let m = 0; m < chordsInSection; m++) {
      const measureStart = currentBeat + m * beatsPerMeasure
      const rootSemitone = pickChordRoot()
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
    currentBeat += chordsInSection * beatsPerMeasure
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
