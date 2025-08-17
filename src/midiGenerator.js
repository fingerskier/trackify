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

  const chordTemplates = {
    blues: {
      major: [0, 4, 7, 10],
      minor: [0, 3, 7, 10],
      diminished: [0, 3, 6, 9],
    },
    rock: {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      diminished: [0, 3, 6],
    },
    jazz: {
      major: [0, 4, 7, 11],
      minor: [0, 3, 7, 10],
      diminished: [0, 3, 6, 10],
    },
    folk: {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      diminished: [0, 3, 6],
    },
    classical: {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      diminished: [0, 3, 6],
    },
  }

  const chordQualities = {
    0: 'major', // I
    2: 'minor', // II
    4: 'minor', // III
    5: 'major', // IV
    7: 'major', // V
    9: 'minor', // VI
    11: 'diminished', // VII
  }

  const genreBiases = {
    blues: {
      lengths: [
        { value: 3, weight: 5 },
        { value: 4, weight: 1 },
      ],
      chords: [
        { semitone: 0, weight: 5 },
        { semitone: 5, weight: 3 },
        { semitone: 7, weight: 4 },
      ],
    },
    rock: {
      lengths: [
        { value: 4, weight: 5 },
        { value: 3, weight: 2 },
        { value: 5, weight: 2 },
      ],
      chords: [
        { semitone: 0, weight: 5 },
        { semitone: 7, weight: 4 },
        { semitone: 5, weight: 3 },
        { semitone: 9, weight: 2 },
      ],
    },
    jazz: {
      lengths: [
        { value: 4, weight: 2 },
        { value: 5, weight: 3 },
        { value: 6, weight: 4 },
      ],
      chords: [
        { semitone: 0, weight: 2 },
        { semitone: 2, weight: 4 },
        { semitone: 5, weight: 3 },
        { semitone: 7, weight: 4 },
        { semitone: 9, weight: 2 },
        { semitone: 11, weight: 1 },
      ],
    },
    folk: {
      lengths: [
        { value: 3, weight: 4 },
        { value: 4, weight: 4 },
      ],
      chords: [
        { semitone: 0, weight: 5 },
        { semitone: 5, weight: 3 },
        { semitone: 7, weight: 4 },
        { semitone: 9, weight: 2 },
      ],
    },
    classical: {
      lengths: [
        { value: 4, weight: 3 },
        { value: 5, weight: 3 },
        { value: 6, weight: 3 },
      ],
      chords: [
        { semitone: 0, weight: 5 },
        { semitone: 2, weight: 3 },
        { semitone: 4, weight: 2 },
        { semitone: 5, weight: 4 },
        { semitone: 7, weight: 4 },
        { semitone: 9, weight: 3 },
        { semitone: 11, weight: 1 },
      ],
    },
  }

  const defaultBias = {
    lengths: [
      { value: 4, weight: 5 },
      { value: 3, weight: 3 },
      { value: 5, weight: 2 },
    ],
    chords: [
      { semitone: 0, weight: 7 },
      { semitone: 7, weight: 6 },
      { semitone: 5, weight: 5 },
      { semitone: 9, weight: 4 },
      { semitone: 2, weight: 3 },
      { semitone: 4, weight: 2 },
      { semitone: 11, weight: 1 },
    ],
  }

  const noteInKey = (semitone, octave) => {
    const base = `C${octave}`
    return Tone.Frequency(base).transpose(keyOffset + semitone).toNote()
  }

  const pickWeighted = (arr) => {
    const total = arr.reduce((sum, o) => sum + o.weight, 0)
    let r = Math.random() * total
    for (const o of arr) {
      if (r < o.weight) return o.value ?? o.semitone
      r -= o.weight
    }
    return arr[0].value ?? arr[0].semitone
  }

  const pickChordRoot = () => {
    const bias = genreBiases[genre]?.chords || defaultBias.chords
    return pickWeighted(bias)
  }

  const pickChordsInSection = () => {
    const bias = genreBiases[genre]?.lengths || defaultBias.lengths
    return pickWeighted(bias)
  }

  const pickChordDuration = () => {
    const durations = [
      { value: 1, weight: 1 },
      { value: 2, weight: 2 },
      { value: 3, weight: 3 },
      { value: 4, weight: 5 },
      { value: 5, weight: 3 },
      { value: 6, weight: 2 },
      { value: 7, weight: 2 },
      { value: 8, weight: 3 },
      { value: 9, weight: 1 },
      { value: 10, weight: 1 },
      { value: 11, weight: 1 },
      { value: 12, weight: 2 },
    ]
    return pickWeighted(durations)
  }

  const getChordIntervals = (root) => {
    const quality = chordQualities[root % 12]
    const templates = chordTemplates[genre] || chordTemplates.rock
    return templates[quality]
  }

  const sections = ['intro', 'verse', 'chorus', 'bridge', 'outro']
  let currentBeat = 0

  const chordProgressions = {}

  sections.forEach((section) => {
    const chordsInSection = pickChordsInSection()
    chordProgressions[section] = []
    for (let m = 0; m < chordsInSection; m++) {
      const measureStart = currentBeat
      const rootSemitone = pickChordRoot()
      const intervals = getChordIntervals(rootSemitone)
      const quality = chordQualities[rootSemitone % 12]
      const suffix =
        quality === 'minor' ? 'm' : quality === 'diminished' ? 'dim' : ''
      const chordName =
        noteInKey(rootSemitone, 3).replace(/\d/g, '') + suffix
      chordProgressions[section].push(chordName)
      const chordNotes = intervals.map((i) => noteInKey(rootSemitone + i, 4))
      const chordNotesGtr = intervals.map((i) => noteInKey(rootSemitone + i, 3))
      const duration = pickChordDuration()

      for (let b = 0; b < duration; b++) {
        const time = measureStart + b
        events.drums.push({ time, note: 'G3', duration: 1 })
        if (b === 0 || Math.random() < 0.2) {
          events.drums.push({ time, note: 'C3', duration: 1 })
        }
        if (b === Math.floor(duration / 2)) {
          events.drums.push({ time, note: 'D3', duration: 1 })
        }
        if (Math.random() < 0.3) {
          events.drums.push({ time: time + 0.5, note: 'G3', duration: 0.5 })
        }
      }

      events.bass.push({
        time: measureStart,
        note: noteInKey(rootSemitone, 2),
        duration,
      })

      chordNotes.forEach((n) => {
        events.keys.push({
          time: measureStart,
          note: n,
          duration,
        })
      })

      for (let b = 0; b < duration; b++) {
        const n =
          chordNotesGtr[Math.floor(Math.random() * chordNotesGtr.length)]
        events.guitar.push({ time: measureStart + b, note: n, duration: 1 })
      }

      currentBeat += duration
    }
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
