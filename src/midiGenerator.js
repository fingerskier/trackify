import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

export function generateSong({ genre, timeSignature, tempo, style }) {
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

  const sections = ['intro', 'verse', 'chorus', 'bridge', 'outro']
  const measuresPerSection = 2
  let currentBeat = 0

  sections.forEach(() => {
    for (let m = 0; m < measuresPerSection; m++) {
      const measureStart = currentBeat + m * beatsPerMeasure

      for (let b = 0; b < beatsPerMeasure; b++) {
        const time = measureStart + b
        events.drums.push({ time, note: 'G3', duration: 1 })

        if (b === 0 || b === Math.floor(beatsPerMeasure / 2)) {
          events.drums.push({ time, note: 'C3', duration: 1 })
        }
        if (b === Math.floor(beatsPerMeasure / 2)) {
          events.drums.push({ time, note: 'D3', duration: 1 })
        }
      }

      events.bass.push({
        time: measureStart,
        note: 'C2',
        duration: beatsPerMeasure,
      })

      ;['C4', 'E4', 'G4'].forEach((n) => {
        events.keys.push({
          time: measureStart,
          note: n,
          duration: beatsPerMeasure,
        })
      })

      for (let b = 0; b < beatsPerMeasure; b += 2) {
        ;['C3', 'E3', 'G3'].forEach((n) => {
          events.guitar.push({
            time: measureStart + b,
            note: n,
            duration: 1,
          })
        })
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

  return { url, start }
}
