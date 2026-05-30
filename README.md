# TTS Announce Card

A self-contained Lovelace custom card for sending TTS announcements to your media players.

No helpers, no templates, no YAML config required. Drop it on any dashboard and go.

```yaml
type: custom:tts-announce-card
```

## How It Works

1. The card renders an **Announce** button on your dashboard
2. Tap it — a popup opens with message, volume, voice, and speaker selection
3. Fill in the details and hit **Send**
4. The card calls **Chime TTS** directly via Home Assistant's WebSocket API
5. If a speaker is marked as **Alexa**, the card uses **notify.alexa_media** instead
6. Chime TTS uses **Edge TTS** for voices

## Dependencies

| Dependency | Purpose | Install |
|---|---|---|
| [Chime TTS](https://github.com/AlexxIT/ChimeTTS) | Interrupts music, plays TTS, restores volume | HACS |
| [Edge TTS](https://github.com/hasscc/hass-edge-tts) | Voice engine | HACS |
| [Alexa Media Player](https://github.com/custom-components/alexa_media_player) | Alexa TTS/announce (optional) | HACS |

No button-card, no Browser Mod, no helpers required.

## Installation

### Via HACS

1. Open HACS → Frontend
2. Click the three dots → **Custom repositories**
3. Add this repo URL and select **Lovelace** category
4. Click **Install**
5. Add to your dashboard:

```yaml
type: custom:tts-announce-card
```

### Manual

Copy `tts-announce-card.js` to `config/www/` and add it as a Lovelace resource:

```yaml
resources:
  - url: /local/tts-announce-card.js
    type: module
```

## Configuration via UI Editor

Add the card to your dashboard and click **Edit** → the UI editor lets you configure everything:

- **Default Voice** — choose from 10 Edge TTS voices
- **Default Volume** — set 0–100 with a slider
- **Alexa Notify Type** — choose `announce` or `tts` for Alexa Media Player devices
- **Speakers** — add/remove speakers with entity selectors populated live from your Home Assistant media players. Click **Auto-discover** to instantly populate every `media_player.*` entity. Rename any speaker. Mark any speaker as **Alexa**.

All configuration is optional — the card works with zero config. For YAML-only dashboards, you can still configure via YAML:

```yaml
type: custom:tts-announce-card
default_voice: en-AU-NatashaNeural
default_volume: 40
alexa_type: announce
speakers:
  - entity: media_player.kitchen
    name: Kitchen
    type: chime
  - entity: media_player.move
    name: Move
    type: chime
  - entity: media_player.main_bedroom
    name: Bedroom
    type: chime
  - entity: media_player.study
    name: Study
    type: chime
  - entity: media_player.tv_room
    name: TV Room
    type: alexa
```

| Option | Type | Default | Description |
|---|---|---|---|
| `default_voice` | string | `en-US-AriaNeural` | Default voice in the dropdown |
| `default_volume` | number | `50` | Default volume (0–100) |
| `alexa_type` | string | `announce` | Alexa notify type (`announce` or `tts`) |
| `speakers` | list | Built-in defaults | Override speaker name mapping |
| `speakers[].type` | string | auto | `chime` or `alexa` (auto-detects Alexa Media Player when omitted) |

## Supported Voices

- `en-US-AriaNeural` — US Female, warm
- `en-US-JennyNeural` — US Female, clear
- `en-US-GuyNeural` — US Male, natural
- `en-US-DavisNeural` — US Male, casual
- `en-AU-NatashaNeural` — Australian Female
- `en-AU-WilliamNeural` — Australian Male
- `en-GB-SoniaNeural` — British Female
- `en-GB-RyanNeural` — British Male
- `en-IE-EmilyNeural` — Irish Female
- `en-ZA-LeahNeural` — South African Female

## How It Works

- **Pure web component** — one JS file, no build step, no npm
- **Shadow DOM** — styles are scoped, won't affect your dashboard
- **HA theme aware** — uses CSS variables so it matches any theme
- **No state writes** — all form values live in the component's JS only
- **`hass.callService()`** — standard HA frontend API, no hacks
