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
5. Chime TTS uses **Edge TTS** for voices

## Dependencies

| Dependency | Purpose | Install |
|---|---|---|
| [Chime TTS](https://github.com/AlexxIT/ChimeTTS) | Interrupts music, plays TTS, restores volume | HACS |
| [Edge TTS](https://github.com/hasscc/hass-edge-tts) | Voice engine | HACS |

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
- **Speakers** — add/remove speakers with entity selectors populated live from your Home Assistant media players. Click **Auto-discover** to instantly populate every `media_player.*` entity. Rename any speaker. Remove any row.

All configuration is optional — the card works with zero config. For YAML-only dashboards, you can still configure via YAML:

```yaml
type: custom:tts-announce-card
default_voice: en-AU-NatashaNeural
default_volume: 40
speakers:
  - entity: media_player.kitchen
    name: Kitchen
  - entity: media_player.move
    name: Move
  - entity: media_player.main_bedroom
    name: Bedroom
  - entity: media_player.study
    name: Study
  - entity: media_player.tv_room
    name: TV Room
```

| Option | Type | Default | Description |
|---|---|---|---|
| `default_voice` | string | `en-US-AriaNeural` | Default voice in the dropdown |
| `default_volume` | number | `50` | Default volume (0–100) |
| `speakers` | list | Built-in defaults | Override speaker name mapping |

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
