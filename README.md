# PS·33 — Portable Sound Survey Recorder

A pocket sampler and step sequencer for the browser, inspired by the
[Teenage Engineering PO-33 K.O!](https://teenage.engineering/store/pocket-operators),
dressed as a **cartographic measuring instrument**: graph paper, ink, a single
vermilion annotation color, typewriter typography — and not a pixel that isn't
measuring something.

Everything runs client-side in a single `index.html`. No frameworks, no build
step, no external assets: all 16 factory sounds are synthesized from raw math
(FM, Karplus-Strong, state-variable filters) into Web Audio buffers the moment
you tap "calibrate".

## Features

- **16 sounds** — 8 melodic instruments (bass, plucked string, FM keys, bell,
  lead, acid line with a resonant filter sweep, pad, formant voice) and 8
  percussion hits (kick, snare, clap, closed/open hi-hat with real choking,
  tom, rimshot, shaker).
- **16-step sequencer × 16 patterns**, with patterns 01–04 preloaded as demo
  songs (boom-bap, four-on-the-floor techno, an ambient "field work" sketch,
  and a breakbeat).
- **Two performance modes** — *KIT* (each pad triggers its own sound) and
  *NOTA* (all 16 pads play the selected sound across a three-octave minor
  pentatonic scale, labeled in solfège).
- **Step writing and live recording** — in *ESCRITURA* mode while stopped, the
  pads become the 16 steps of the bar; while playing, pad hits are quantized
  onto the pattern in real time.
- **Field sampling** — arm the microphone, hold a pad, and record up to 4
  seconds. The sample is silence-trimmed, normalized, assigned to that slot,
  and is fully pitchable in *NOTA* mode like any factory sound.
- **The strip-chart display** — the screen is a continuous seismograph-style
  recording of the output signal, drawn in ink on graph paper.
- **Local persistence** — your patterns, tempo and microphone samples are
  saved automatically to the browser's IndexedDB. They live **on your device
  only**; nothing is ever uploaded. The *⟲ ESTADO INICIAL* button (with a
  confirmation tap) wipes your data and restores the factory kit and demo
  patterns.
- **Mobile-first & installable (PWA)** — sized for a phone screen, multi-touch
  pads, a fullscreen toggle (*PLENA*), and a web manifest + service worker so it
  installs to the home screen and launches **standalone, with no browser chrome
  or borders**. It also works offline once loaded. A dark "night cabinet" theme
  follows your system preference.
- **Font-independent icons** — every control glyph is an inline SVG, so the
  interface renders identically on any server or device regardless of which
  fonts are installed (no more missing-glyph boxes).

## Running it

It is a static page plus a zero-dependency Node server:

```bash
node server.js          # → http://localhost:8033
PORT=3000 node server.js
```

Or serve `index.html` with anything else (nginx, Apache, `python3 -m
http.server`, GitHub Pages…). There is no backend logic — the Node server just
serves files.

**One requirement to know about:** browsers only expose the microphone — and
register the service worker for offline/installable use — in a *secure
context*. `http://localhost` qualifies; a deployment on a real domain needs
**HTTPS** (put the server behind your usual TLS reverse proxy). Without HTTPS
everything else still works — only field sampling and PWA install are disabled.

### Installing as an app

Served over HTTPS (or on localhost), open it in the browser and use **Install**
(Chrome/Edge/Android: address-bar install icon or menu → *Install app*; iOS
Safari: *Share → Add to Home Screen*). It then launches full-screen with no
browser UI.

The app icons are generated, dependency-free, by `tools/gen-icons.js` — a
framed cartographic cross-hair. Re-run `node tools/gen-icons.js` if you restyle
the mark.

## Controls

| Control | Action |
|---|---|
| **MARCHA** | Play / stop the current pattern |
| **ESCRITURA** | Write mode. Stopped: pads = steps, tap to place/remove the current sound. Playing: live-record pad hits |
| **SONIDO** | Then tap a pad to select the active sound (01–16) |
| **PATRÓN** | Then tap a pad to select the active pattern (01–16) |
| **KIT / NOTA** | Toggle pads between one-sound-per-pad and pentatonic scale of the selected sound |
| **MICRÓFONO** | Arm sampling, then *hold* a pad to record into that slot (max 4 s) |
| **PULSO − / +** | Tempo, 40–240 BPM |
| **⛶ PLENA** | Fullscreen (on iPhone use *Share → Add to Home Screen* instead) |
| **⌫ BORRAR PATRÓN** | Clear the current pattern (tap twice to confirm) |
| **⟲ ESTADO INICIAL** | Factory reset: wipes saved samples and patterns (tap twice to confirm) |

## How data is stored

State is persisted in IndexedDB under the `ps33` database: one record for the
song (all 16 patterns + tempo, saved with a short debounce after every edit)
and one record per sampled slot (raw Float32 PCM plus its sample rate, so it
survives across devices with different audio hardware). Clearing the site's
data in your browser — or the factory-reset button — removes everything.

## Tech notes

- Pure Web Audio API: a lookahead scheduler (25 ms timer, 120 ms horizon) for
  jitter-free sequencing; samples are pitched with `playbackRate` in equal
  temperament.
- The factory kit is generated at startup by plain-JavaScript DSP — no audio
  files are shipped or fetched.
- Microphone capture uses `MediaRecorder` → `decodeAudioData`, then leading
  silence is trimmed and the sample normalized.
- Single HTML file, system fonts (American Typewriter with Courier fallback),
  light and dark themes via CSS custom properties.

---

*Made with Claude Code. Not affiliated with Teenage Engineering — go buy a
real PO-33, it fits in a coat pocket and survives fieldwork.*
