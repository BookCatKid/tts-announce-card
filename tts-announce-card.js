const VOICES = [
  { id: "en-US-AriaNeural", label: "Aria", desc: "US Female · warm" },
  { id: "en-US-JennyNeural", label: "Jenny", desc: "US Female · clear" },
  { id: "en-US-GuyNeural", label: "Guy", desc: "US Male · natural" },
  { id: "en-US-DavisNeural", label: "Davis", desc: "US Male · casual" },
  { id: "en-AU-NatashaNeural", label: "Natasha", desc: "AU Female" },
  { id: "en-AU-WilliamNeural", label: "William", desc: "AU Male" },
  { id: "en-GB-SoniaNeural", label: "Sonia", desc: "GB Female" },
  { id: "en-GB-RyanNeural", label: "Ryan", desc: "GB Male" },
  { id: "en-IE-EmilyNeural", label: "Emily", desc: "IE Female" },
  { id: "en-ZA-LeahNeural", label: "Leah", desc: "ZA Female" },
];

const DEFAULT_SPEAKERS = [
  { entity: "media_player.kitchen", name: "Kitchen" },
  { entity: "media_player.move", name: "Move" },
  { entity: "media_player.main_bedroom", name: "Main Bedroom" },
  { entity: "media_player.study", name: "Study" },
  { entity: "media_player.tv_room", name: "TV Room" },
];

const PLATFORM_META = {
  alexa_media: { label: "Alexa", icon: "mdi:amazon" },
  sonos: { label: "Sonos", icon: "mdi:speaker" },
  spotify: { label: "Spotify", icon: "mdi:spotify" },
  cast: { label: "Chromecast", icon: "mdi:cast" },
  plex: { label: "Plex", icon: "mdi:plex" },
  kodi: { label: "Kodi", icon: "mdi:kodi" },
  apple_tv: { label: "Apple TV", icon: "mdi:apple" },
  roku: { label: "Roku", icon: "mdi:television" },
  yamaha: { label: "Yamaha", icon: "mdi:speaker-wireless" },
  denonavr: { label: "Denon", icon: "mdi:speaker-wireless" },
  universal: { label: "Universal", icon: "mdi:remote" },
  squeezebox: { label: "Squeezebox", icon: "mdi:speaker" },
  dlna_dmr: { label: "DLNA", icon: "mdi:cast-audio" },
  mpd: { label: "MPD", icon: "mdi:music" },
  snapcast: { label: "Snapcast", icon: "mdi:speaker-multiple" },
  bluesound: { label: "Bluesound", icon: "mdi:speaker" },
  heos: { label: "HEOS", icon: "mdi:speaker" },
  bang_olufsen: { label: "Bang & Olufsen", icon: "mdi:speaker" },
  forked_daapd: { label: "OwnTone", icon: "mdi:music" },
};

function getPlatformMeta(hass, entityId) {
  if (!hass) return null;
  const state = hass.states[entityId];
  if (!state) return null;
  const platform =
    state.attributes.platform ||
    state.attributes.integration ||
    hass.entities?.[entityId]?.platform;
  if (!platform) return null;
  return PLATFORM_META[platform] || { label: platform, icon: "mdi:speaker" };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_STYLE = `
  :host { display: block; }

  .trigger {
    cursor: pointer;
  }

  .trigger-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    transition: background-color 0.15s;
  }

  .trigger-inner:hover {
    background: var(--secondary-background-color);
  }

  .trigger-icon {
    --mdc-icon-size: 24px;
    color: var(--primary-color);
  }

  .trigger-text {
    font-size: 16px;
    font-weight: 500;
  }

  .form {
    padding: 4px 0;
  }

  .field {
    margin-top: 16px;
  }

  .field-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }

  .field-label-btn {
    font-size: 12px;
    color: var(--primary-color);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .field-label-btn:active {
    opacity: 0.7;
  }

  .msg-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 80px;
    resize: vertical;
    padding: 12px 16px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
    line-height: 1.5;
  }
  .msg-textarea:focus {
    border-color: var(--primary-color);
  }
  .msg-textarea::placeholder {
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .volume-control ha-slider {
    flex: 1;
  }

  .volume-value {
    min-width: 36px;
    text-align: right;
    font-size: 14px;
    font-weight: 500;
  }

  #speakers {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .status {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 12px;
    min-height: 18px;
  }

  .status.error {
    color: var(--error-color);
  }

  .status.success {
    color: var(--success-color, #43a047);
  }
`;

class TTSAnnounceCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._form = {
      message: "",
      volume: 50,
      voice: "en-US-AriaNeural",
      speakers: [],
    };
    this._render();
    this._bind();
  }

  disconnectedCallback() {}

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config || {};
  }

  set config(c) {
    this.setConfig(c);
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLE}</style>

      <ha-card id="trigger" class="trigger" tabindex="0" role="button" aria-label="Open announcement">
        <div class="trigger-inner">
          <ha-icon class="trigger-icon" icon="mdi:microphone-outline"></ha-icon>
          <span class="trigger-text">Announce</span>
        </div>
      </ha-card>

      <ha-dialog id="dialog" header-title="Send Announcement" prevent-scrim-close>
        <div class="form">
          <textarea
            id="message"
            class="msg-textarea"
            placeholder="Type your announcement…"
            maxlength="500"
            autofocus
          ></textarea>

          <ha-select id="voice" label="Voice" class="field"></ha-select>

          <div class="field">
            <div class="field-label">Volume</div>
            <div class="volume-control">
              <ha-slider id="volume" min="0" max="100" value="50" step="1" pin></ha-slider>
              <span class="volume-value" id="volumeDisplay">50%</span>
            </div>
          </div>

          <div class="field">
            <div class="field-label">
              <span>Speakers</span>
              <button class="field-label-btn" id="selectAllBtn">Select All</button>
            </div>
            <div id="speakers"></div>
          </div>

          <div class="status" id="status">Select at least one speaker and enter a message</div>
        </div>

        <ha-button slot="footer" id="cancelBtn" appearance="outlined">Cancel</ha-button>
        <ha-button slot="footer" id="sendBtn" disabled>Send</ha-button>
      </ha-dialog>
    `;

    const voiceSelect = this.shadowRoot.getElementById("voice");
    voiceSelect.options = VOICES.map((v) => ({
      value: v.id,
      label: `${v.label} — ${v.desc}`,
    }));
  }

  _bind() {
    const s = (id) => this.shadowRoot.getElementById(id);

    s("trigger").addEventListener("click", () => this._open());
    s("trigger").addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this._open();
      }
    });

    s("cancelBtn").addEventListener("click", () => {
      s("dialog").open = false;
    });

    s("sendBtn").addEventListener("click", () => this._send());

    s("message").addEventListener("input", () => {
      this._form.message = s("message").value;
      this._updateSendButton();
    });

    s("volume").addEventListener("input", () => {
      this._form.volume = parseInt(s("volume").value, 10);
      s("volumeDisplay").textContent = `${this._form.volume}%`;
    });

    s("voice").addEventListener("selected", (e) => {
      this._form.voice = e.detail.value;
    });

    s("selectAllBtn").addEventListener("click", () => this._toggleSelectAll());
  }

  _speakerEntities() {
    return this._config.speakers?.length
      ? this._config.speakers
      : DEFAULT_SPEAKERS;
  }

  _updateSpeakers() {
    const container = this.shadowRoot.getElementById("speakers");
    container.innerHTML = "";
    const speakers = this._speakerEntities();
    const selected = this._form.speakers;

    speakers.forEach((sp) => {
      const cb = document.createElement("ha-checkbox");
      cb.value = sp.entity;
      const meta = getPlatformMeta(this._hass, sp.entity);
      cb.textContent = meta ? `${sp.name} (${meta.label})` : sp.name;
      if (selected.includes(sp.entity)) {
        cb.checked = true;
      }

      cb.addEventListener("change", () => {
        if (cb.checked) {
          this._form.speakers.push(sp.entity);
        } else {
          this._form.speakers = this._form.speakers.filter(
            (e) => e !== sp.entity,
          );
        }
        this._updateSendButton();
        this._updateSelectAllButton();
      });

      container.appendChild(cb);
    });
  }

  _updateSelectAllButton() {
    const btn = this.shadowRoot.getElementById("selectAllBtn");
    if (!btn) return;
    const allEntities = this._speakerEntities().map((sp) => sp.entity);
    if (!allEntities.length) {
      btn.textContent = "Select All";
      return;
    }
    const allSelected = allEntities.every((e) =>
      this._form.speakers.includes(e),
    );
    btn.textContent = allSelected ? "Deselect All" : "Select All";
  }

  _toggleSelectAll() {
    const allEntities = this._speakerEntities().map((sp) => sp.entity);
    const allSelected = allEntities.every((e) =>
      this._form.speakers.includes(e),
    );

    if (allSelected) {
      this._form.speakers = [];
    } else {
      this._form.speakers = [...allEntities];
    }

    this._updateSpeakers();
    this._updateSelectAllButton();
    this._updateSendButton();
  }

  _updateSendButton() {
    const btn = this.shadowRoot.getElementById("sendBtn");
    const status = this.shadowRoot.getElementById("status");
    const hasMessage = this._form.message.trim().length > 0;
    const hasSpeakers = this._form.speakers.length > 0;

    btn.disabled = !(hasMessage && hasSpeakers);
    status.classList.remove("error", "success");

    if (!hasMessage && !hasSpeakers) {
      status.textContent = "Enter a message and select at least one speaker";
    } else if (!hasMessage) {
      status.textContent = "Enter a message";
    } else if (!hasSpeakers) {
      status.textContent = "Select at least one speaker";
    } else {
      const names = this._speakerEntities()
        .filter((sp) => this._form.speakers.includes(sp.entity))
        .map((sp) => sp.name);
      status.textContent = `Ready · ${names.join(", ")}`;
    }
  }

  _open() {
    this._form.speakers = [];
    this._form.message = "";
    this._form.volume = this._config.default_volume ?? 50;
    this._form.voice = this._config.default_voice || "en-US-AriaNeural";

    const msg = this.shadowRoot.getElementById("message");
    msg.value = "";
    this.shadowRoot.getElementById("voice").value = this._form.voice;
    this.shadowRoot.getElementById("volume").value = this._form.volume;
    this.shadowRoot.getElementById("volumeDisplay").textContent = `${this._form.volume}%`;

    this._updateSpeakers();
    this._updateSelectAllButton();
    this._updateSendButton();
    this.shadowRoot.getElementById("dialog").open = true;

    setTimeout(() => msg.focus(), 100);
  }

  _send() {
    const message = this._form.message.trim();
    const speakers = [...this._form.speakers];
    if (!message || !speakers.length) return;

    const btn = this.shadowRoot.getElementById("sendBtn");
    const status = this.shadowRoot.getElementById("status");
    btn.disabled = true;
    status.classList.remove("error", "success");
    status.textContent = "Sending…";

    const done = (err) => {
      if (err) {
        btn.disabled = false;
        status.classList.add("error");
        status.textContent = `Error: ${err.message || "Failed to send. Check Chime TTS or Alexa service."}`;
      } else {
        btn.disabled = false;
        status.classList.add("success");
        status.textContent = "Announcement sent!";
      }
    };

    try {
      const { chimeTargets, alexaTargets } = this._splitTargets(speakers);
      const calls = [];
      if (chimeTargets.length) {
        calls.push(
          this._hass.callService(
            "chime_tts",
            "say",
            this._serviceData(message, chimeTargets),
          ),
        );
      }
      if (alexaTargets.length) {
        calls.push(
          this._hass.callService(
            "notify",
            "alexa_media",
            this._alexaServiceData(message, alexaTargets),
          ),
        );
      }
      if (!calls.length) {
        done(new Error("No valid targets selected."));
        return;
      }
      Promise.all(
        calls.map((result) =>
          result && typeof result.then === "function"
            ? result
            : Promise.resolve(),
        ),
      )
        .then(() => done(null))
        .catch(done);
    } catch (err) {
      done(err);
    }
  }

  _splitTargets(speakers) {
    const chimeTargets = [];
    const alexaTargets = [];
    speakers.forEach((entity) => {
      if (this._isAlexaSpeaker(entity)) {
        alexaTargets.push(entity);
      } else {
        chimeTargets.push(entity);
      }
    });
    return { chimeTargets, alexaTargets };
  }

  _isAlexaSpeaker(entityId) {
    const entry = this._speakerEntities().find((sp) => sp.entity === entityId);
    if (entry?.type) return entry.type === "alexa";
    const platform = this._speakerPlatform(entityId);
    if (!platform) return false;
    const value = platform.toLowerCase();
    return value === "alexa_media" || value.includes("alexa");
  }

  _speakerPlatform(entityId) {
    if (!this._hass) return null;
    const state = this._hass.states?.[entityId];
    if (!state) return null;
    return (
      state.attributes.platform ||
      state.attributes.integration ||
      this._hass.entities?.[entityId]?.platform ||
      null
    );
  }

  _alexaServiceData(message, targets) {
    const type = (this._config.alexa_type || "announce").trim() || "announce";
    return {
      message,
      target: targets,
      data: { type },
    };
  }

  _serviceData(message, speakers) {
    const ttsPlatform = "tts.edge_tts_service_edge_tts";
    const volume = Number.isFinite(this._form.volume)
      ? this._form.volume
      : parseInt(this._form.volume, 10);
    const data = {
      entity_id: speakers.join(","),
      message,
      announce: true,
    };
    data.tts_platform = ttsPlatform;
    if (this._form.voice) {
      data.voice = this._form.voice;
      const language = this._voiceToLanguage(this._form.voice);
      if (language) data.language = language;
    }
    if (Number.isFinite(volume)) {
      data.volume_level = Math.max(0, Math.min(100, volume)) / 100;
    }
    return data;
  }

  _voiceToLanguage(voice) {
    if (!voice || typeof voice !== "string") return null;
    const parts = voice.split("-");
    if (parts.length < 2) return null;
    return `${parts[0]}-${parts[1]}`;
  }

  static async getConfigElement() {
    await customElements.whenDefined("tts-announce-card-editor");
    return document.createElement("tts-announce-card-editor");
  }

  static getStubConfig() {
    return {
      default_voice: "en-US-AriaNeural",
      default_volume: 50,
      speakers: DEFAULT_SPEAKERS,
    };
  }
}

// ─── Editor ───────────────────────────────────────────────────────────────────

const EDITOR_STYLE = `
  :host { display: block; }
  .editor { padding: 8px 0; }
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 12px;
    color: var(--secondary-text-color);
    display: block;
    margin-bottom: 4px;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .volume-control ha-slider { flex: 1; }

  .speaker-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .speaker-row .entity-select { flex: 1; min-width: 0; }
  .speaker-row .type-select { width: 110px; flex-shrink: 0; }
  .speaker-row ha-input { width: 130px; flex-shrink: 0; }

  .speaker-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .empty-state {
    font-size: 13px;
    color: var(--secondary-text-color);
    font-style: italic;
    padding: 8px 0;
  }
`;

class TTSAnnounceCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._entitiesKey = "";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const entities = this._getMediaPlayers();
    const key = this._mediaPlayersKey(entities);
    if (key !== this._entitiesKey) {
      this._entitiesKey = key;
      this._render();
    }
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    this._render();
  }

  _getMediaPlayers() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter((id) => id.startsWith("media_player."))
      .map((id) => {
        const state = this._hass.states[id];
        const platform =
          state.attributes.platform ||
          state.attributes.integration ||
          this._hass.entities?.[id]?.platform ||
          null;
        const meta = platform ? PLATFORM_META[platform] : null;
        return {
          entity_id: id,
          name: state.attributes.friendly_name || id,
          platform,
          meta,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  _mediaPlayersKey(entities) {
    return JSON.stringify(
      entities.map((e) => [e.entity_id, e.name, e.platform || ""]),
    );
  }

  _render() {
    const voice = this._config.default_voice || "en-US-AriaNeural";
    const volume = this._config.default_volume ?? 50;
    const alexaType =
      (this._config.alexa_type || "announce").trim().toLowerCase() || "announce";

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLE}</style>
      <div class="editor">

        <div class="section">
          <label class="section-title">Default Voice</label>
          <ha-select id="voice" label="Voice"></ha-select>
        </div>

        <div class="section">
          <label class="section-title">Default Volume — <span id="volumeDisplay">${volume}</span>%</label>
          <div class="volume-control">
            <ha-slider id="volume" min="0" max="100" value="${volume}" step="1" pin></ha-slider>
          </div>
        </div>

        <div class="section">
          <label class="section-title">Alexa Notify Type</label>
          <ha-select id="alexaType" label="Alexa Notify Type"></ha-select>
        </div>

        <div class="section">
          <label class="section-title">Speakers</label>
          <div id="speakersContainer"></div>
          <div class="speaker-actions">
            <ha-button id="addSpeaker" appearance="outlined">Add Speaker</ha-button>
            <ha-button id="autoDiscover" appearance="outlined">Auto-discover</ha-button>
          </div>
        </div>

      </div>
    `;

    const voiceSelect = this.shadowRoot.getElementById("voice");
    voiceSelect.options = VOICES.map((v) => ({
      value: v.id,
      label: `${v.label} — ${v.desc}`,
    }));
    voiceSelect.value = voice;

    const alexaSelect = this.shadowRoot.getElementById("alexaType");
    alexaSelect.options = [
      { value: "announce", label: "Announce" },
      { value: "tts", label: "TTS" },
    ];
    alexaSelect.value = alexaType;

    this._renderSpeakerRows();
    this._bindEditor();
  }

  _renderSpeakerRows() {
    const container = this.shadowRoot.getElementById("speakersContainer");
    if (!container) return;

    const speakers = this._config.speakers || [];
    const entities = this._getMediaPlayers();

    if (!speakers.length) {
      container.innerHTML =
        '<div class="empty-state">No speakers configured. Add one below or auto-discover.</div>';
      return;
    }

    container.innerHTML = speakers
      .map((sp, i) => {
        const name = (sp.name || "").replace(/"/g, "&quot;");
        return `
          <div class="speaker-row" data-index="${i}">
            <ha-select class="entity-select" label="Entity"></ha-select>
            <ha-select class="type-select" label="Type"></ha-select>
            <ha-input class="name-input" label="Label" value="${name}"></ha-input>
            <ha-icon-button class="remove-btn" icon="mdi:close"></ha-icon-button>
          </div>`;
      })
      .join("");

    container.querySelectorAll(".entity-select").forEach((select, i) => {
      select.options = entities.map((e) => ({
        value: e.entity_id,
        label: `${e.name}${e.meta ? ` (${e.meta.label})` : e.platform ? ` (${e.platform})` : ""}`,
      }));
      const needsMissing =
        speakers[i]?.entity &&
        !entities.some((e) => e.entity_id === speakers[i].entity);
      if (needsMissing) {
        select.options = [
          { value: speakers[i].entity, label: speakers[i].entity },
          ...select.options,
        ];
      }
      if (speakers[i]?.entity) select.value = speakers[i].entity;
    });

    container.querySelectorAll(".type-select").forEach((select, i) => {
      select.options = [
        { value: "chime", label: "Chime" },
        { value: "alexa", label: "Alexa" },
      ];
      if (speakers[i]?.type) select.value = speakers[i].type;
    });

    this._bindSpeakerRows();
  }

  _bindEditor() {
    const shadow = this.shadowRoot;

    shadow.getElementById("voice")?.addEventListener("selected", (e) => {
      shadow.getElementById("voice").value = e.detail.value;
      this._config.default_voice = e.detail.value;
      this._fireConfigChanged();
    });

    shadow.getElementById("volume")?.addEventListener("input", () => {
      const val = parseInt(shadow.getElementById("volume").value, 10);
      this._config.default_volume = val;
      const disp = shadow.getElementById("volumeDisplay");
      if (disp) disp.textContent = val;
      this._fireConfigChanged();
    });

    shadow.getElementById("alexaType")?.addEventListener("selected", (e) => {
      shadow.getElementById("alexaType").value = e.detail.value;
      this._config.alexa_type = e.detail.value;
      this._fireConfigChanged();
    });

    shadow.getElementById("addSpeaker")?.addEventListener("click", () => {
      const speakers = this._config.speakers || [];
      speakers.push({ entity: "", name: "", type: "chime" });
      this._config.speakers = speakers;
      this._renderSpeakerRows();
      this._fireConfigChanged();
    });

    shadow.getElementById("autoDiscover")?.addEventListener("click", () => {
      const entities = this._getMediaPlayers();
      this._config.speakers = entities.map((e) => ({
        entity: e.entity_id,
        name: e.name,
        type: this._guessSpeakerType(e.entity_id, entities),
      }));
      this._renderSpeakerRows();
      this._fireConfigChanged();
    });
  }

  _bindSpeakerRows() {
    this.shadowRoot.querySelectorAll(".entity-select").forEach((el) => {
      el.addEventListener("selected", (e) => {
        el.value = e.detail.value;
        this._onEntityChange(el);
      });
    });
    this.shadowRoot.querySelectorAll(".type-select").forEach((el) => {
      el.addEventListener("selected", (e) => {
        el.value = e.detail.value;
        this._onTypeChange(el);
      });
    });
    this.shadowRoot.querySelectorAll(".name-input").forEach((el) => {
      el.addEventListener("input", () => this._onNameChange(el));
    });
    this.shadowRoot.querySelectorAll(".remove-btn").forEach((el) => {
      el.addEventListener("click", () => this._onRemoveSpeaker(el));
    });
  }

  _guessSpeakerType(entityId, entities) {
    if (!entityId) return "chime";
    const match = entities?.find((e) => e.entity_id === entityId);
    const platform = (match?.platform || "").toLowerCase();
    return platform.includes("alexa") ? "alexa" : "chime";
  }

  _rowIndex(el) {
    return parseInt(el.closest(".speaker-row")?.dataset.index ?? "-1", 10);
  }

  _onEntityChange(selectEl) {
    const index = this._rowIndex(selectEl);
    const entity = selectEl.value;
    if (index < 0) return;
    const speakers = this._config.speakers || [];
    if (!speakers[index]) return;
    speakers[index].entity = entity;
    if (entity && this._hass?.states[entity]) {
      const fn = this._hass.states[entity].attributes.friendly_name;
      if (fn) {
        speakers[index].name = fn;
        const row = this.shadowRoot.querySelectorAll(".speaker-row")[index];
        const nameInput = row?.querySelector(".name-input");
        if (nameInput) nameInput.value = fn;
      }
    }
    if (!speakers[index].type) {
      speakers[index].type = this._guessSpeakerType(
        entity,
        this._getMediaPlayers(),
      );
      const row = this.shadowRoot.querySelectorAll(".speaker-row")[index];
      const typeSelect = row?.querySelector(".type-select");
      if (typeSelect) {
        typeSelect.value = speakers[index].type;
      }
    }
    this._config.speakers = speakers;
    this._fireConfigChanged();
  }

  _onTypeChange(selectEl) {
    const index = this._rowIndex(selectEl);
    if (index < 0) return;
    const speakers = this._config.speakers || [];
    if (!speakers[index]) return;
    speakers[index].type = selectEl.value;
    this._config.speakers = speakers;
    this._fireConfigChanged();
  }

  _onNameChange(inputEl) {
    const index = this._rowIndex(inputEl);
    if (index < 0) return;
    const speakers = this._config.speakers || [];
    if (!speakers[index]) return;
    speakers[index].name = inputEl.value;
    this._config.speakers = speakers;
    this._fireConfigChanged();
  }

  _onRemoveSpeaker(el) {
    const index = this._rowIndex(el);
    if (index < 0) return;
    const speakers = this._config.speakers || [];
    speakers.splice(index, 1);
    this._config.speakers = speakers.length ? speakers : undefined;
    this._renderSpeakerRows();
    this._fireConfigChanged();
  }

  _fireConfigChanged() {
    const config = {
      type: this._config.type || "custom:tts-announce-card",
      default_voice: this._config.default_voice || "en-US-AriaNeural",
      default_volume: this._config.default_volume ?? 50,
    };
    if (this._config.alexa_type?.trim()) {
      config.alexa_type = this._config.alexa_type.trim();
    }
    if (this._config.speakers?.length) {
      config.speakers = this._config.speakers
        .filter((s) => s.entity)
        .map((s) => ({
          entity: s.entity,
          name: s.name || s.entity,
          ...(s.type ? { type: s.type } : {}),
        }));
    }
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("tts-announce-card-editor", TTSAnnounceCardEditor);
customElements.define("tts-announce-card", TTSAnnounceCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "tts-announce-card",
  name: "TTS Announce Card",
  description:
    "Send voice announcements to media players with volume, voice, and speaker selection.",
  preview: false,
});
