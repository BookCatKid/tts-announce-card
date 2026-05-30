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

// Map known HA platform strings to friendly integration names + icons
const PLATFORM_META = {
  alexa_media: { label: "Alexa", icon: "mdi:amazon-alexa" },
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
  // platform is sometimes in attributes, sometimes we infer from entity_id prefix patterns
  const platform =
    state.attributes.platform ||
    state.attributes.integration ||
    hass.entities?.[entityId]?.platform;
  if (!platform) return null;
  return PLATFORM_META[platform] || { label: platform, icon: "mdi:speaker" };
}

// ─── Shared native-select style (used in both card modal and editor) ──────────
const NATIVE_SELECT_CSS = `
  .native-select-wrap {
    position: relative;
    width: 100%;
  }
  .native-select-wrap select {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    padding: 12px 36px 12px 14px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    font-size: 14px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }
  .native-select-wrap select:focus {
    border-color: var(--primary-color);
  }
  .native-select-wrap::after {
    content: '';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--secondary-text-color);
    pointer-events: none;
  }
`;

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_STYLE = `
  :host { display: block; }

  .trigger-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    user-select: none;
    border-radius: var(--ha-card-border-radius, 12px);
  }
  .trigger-content:hover { background: var(--secondary-background-color); }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .overlay.open { display: flex; }

  .modal {
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalIn 0.18s ease-out;
    /* ensure modal sits above overlay */
    position: relative;
    z-index: 1000;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }

  .modal-header {
    padding: 20px 20px 0;
    font-size: 20px;
    font-weight: 500;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    color: var(--primary-text-color);
  }
  .modal-body   { padding: 8px 20px 8px; }
  .modal-footer {
    padding: 8px 20px 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .field { margin-top: 14px; }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--secondary-text-color);
    margin-bottom: 5px;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
  }

  /* ── Native textarea ── */
  .msg-textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 80px;
    resize: vertical;
    padding: 10px 12px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
    line-height: 1.4;
  }
  .msg-textarea:focus { border-color: var(--primary-color); }
  .msg-textarea::placeholder { color: var(--secondary-text-color); opacity: 0.7; }

  ${NATIVE_SELECT_CSS}

  /* ── Speakers grid ── */
  .speakers-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .speaker-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--divider-color, #e0e0e0);
    background: transparent;
    color: var(--primary-text-color);
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    text-align: left;
  }
  .speaker-btn-name {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
  }
  .speaker-btn-meta {
    font-size: 10px;
    opacity: 0.65;
    margin-top: 1px;
    line-height: 1.2;
  }
  .speaker-btn.selected {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .speaker-btn.selected .speaker-btn-meta { opacity: 0.85; }
  .speaker-btn:hover:not(.selected) {
    border-color: var(--primary-color);
  }

  /* ── Volume ── */
  .volume-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .volume-row ha-slider { flex: 1; }
  .volume-value {
    min-width: 28px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-text-color);
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
  }

  /* ── Trigger icon ── */
  ha-icon[icon="mdi:microphone"] {
    --mdc-icon-size: 22px;
    color: var(--text-primary-color, #fff);
    background: var(--primary-color);
    border-radius: 50%;
    padding: 8px;
    box-sizing: content-box;
  }

  /* ── Status ── */
  .status {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-align: center;
    margin-top: 12px;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    min-height: 16px;
  }
  .status.error { color: var(--error-color, #db4437); }

  /* ── Footer buttons ── */
  .footer-btn {
    padding: 8px 20px;
    border-radius: 4px;
    border: none;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, background 0.15s;
    letter-spacing: 0.3px;
  }
  .footer-btn:disabled { opacity: 0.4; cursor: default; }
  .footer-btn.cancel {
    background: transparent;
    color: var(--primary-color);
  }
  .footer-btn.cancel:hover:not(:disabled) { background: var(--secondary-background-color); }
  .footer-btn.send {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .footer-btn.send:hover:not(:disabled) { opacity: 0.88; }
`;

class TTSAnnounceCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._modalOpen = false;
    this._form = {
      message: "",
      volume: 50,
      voice: "en-US-AriaNeural",
      speakers: [],
    };
    this._render();
    this._bind();
  }

  disconnectedCallback() {
    if (this._keydownHandler)
      window.removeEventListener("keydown", this._keydownHandler);
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config || {};
    if (this._config.default_volume != null)
      this._form.volume = this._config.default_volume;
    if (this._config.default_voice)
      this._form.voice = this._config.default_voice;
  }
  set config(c) {
    this.setConfig(c);
  }

  _voiceSelectHTML(selectedId) {
    return `
      <div class="native-select-wrap">
        <select id="voice">
          ${VOICES.map(
            (v) =>
              `<option value="${v.id}"${v.id === selectedId ? " selected" : ""}>${v.label} — ${v.desc}</option>`,
          ).join("")}
        </select>
      </div>`;
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLE}</style>
      <ha-card id="trigger" tabindex="0" role="button" aria-label="Open announce">
        <div class="trigger-content">
          <ha-icon icon="mdi:microphone"></ha-icon>
          <span style="font-size:15px;font-weight:500;font-family:var(--primary-font-family,'Roboto',sans-serif);color:var(--primary-text-color)">Announce</span>
        </div>
      </ha-card>

      <div class="overlay" id="overlay">
        <ha-card class="modal">
          <div class="modal-header">Send Announcement</div>
          <div class="modal-body">

            <div class="field">
              <div class="field-label">Message</div>
              <textarea
                id="message"
                class="msg-textarea"
                placeholder="Type your announcement…"
                maxlength="500"
              ></textarea>
            </div>

            <div class="field">
              <div class="field-label">Voice</div>
              ${this._voiceSelectHTML(this._form.voice)}
            </div>

            <div class="field">
              <div class="field-label">Volume — <span id="volumeDisplay">${this._form.volume}</span>%</div>
              <div class="volume-row">
                <ha-slider id="volume" min="0" max="100" value="${this._form.volume}" step="1" pin></ha-slider>
              </div>
            </div>

            <div class="field">
              <div class="field-label">Speakers</div>
              <div class="speakers-grid" id="speakers"></div>
            </div>

            <div class="status" id="status">Select at least one speaker and enter a message</div>
          </div>
          <div class="modal-footer">
            <button class="footer-btn cancel" id="cancelBtn">Cancel</button>
            <button class="footer-btn send"   id="sendBtn" disabled>Send</button>
          </div>
        </ha-card>
      </div>
    `;
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

    // Only close when clicking the dark backdrop, not the modal card itself
    s("overlay").addEventListener("click", (e) => {
      if (e.target === s("overlay")) this._close();
    });

    s("cancelBtn").addEventListener("click", () => this._close());
    s("sendBtn").addEventListener("click", () => this._send());

    s("message").addEventListener("input", () => {
      this._form.message = s("message").value;
      this._updateSendButton();
    });

    s("volume").addEventListener("input", () => {
      this._form.volume = parseInt(s("volume").value, 10);
      s("volumeDisplay").textContent = this._form.volume;
    });

    // Native <select> — no shadow DOM focus issues
    s("voice").addEventListener("change", (e) => {
      this._form.voice = e.target.value;
    });

    window.addEventListener(
      "keydown",
      (this._keydownHandler = (e) => {
        if (e.key === "Escape" && this._modalOpen) this._close();
      }),
    );
  }

  _speakerEntities() {
    return this._config.speakers?.length
      ? this._config.speakers
      : DEFAULT_SPEAKERS;
  }

  _renderSpeakers() {
    const container = this.shadowRoot.getElementById("speakers");
    if (!container) return;
    const active = this._form.speakers;
    const speakers = this._speakerEntities();

    container.innerHTML = speakers
      .map((sp) => {
        const selected = active.includes(sp.entity);
        const meta = getPlatformMeta(this._hass, sp.entity);
        const metaHTML = meta
          ? `<span class="speaker-btn-meta">${meta.label}</span>`
          : "";
        return `
        <button class="speaker-btn${selected ? " selected" : ""}" data-entity="${sp.entity}">
          <span class="speaker-btn-name">${sp.name}</span>
          ${metaHTML}
        </button>`;
      })
      .join("");

    container.querySelectorAll(".speaker-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entity = btn.dataset.entity;
        const idx = this._form.speakers.indexOf(entity);
        if (idx >= 0) {
          this._form.speakers.splice(idx, 1);
          btn.classList.remove("selected");
        } else {
          this._form.speakers.push(entity);
          btn.classList.add("selected");
        }
        this._updateSendButton();
      });
    });
  }

  _updateSendButton() {
    const btn = this.shadowRoot.getElementById("sendBtn");
    const status = this.shadowRoot.getElementById("status");
    const hasMessage = this._form.message.trim().length > 0;
    const hasSpeakers = this._form.speakers.length > 0;

    btn.disabled = !(hasMessage && hasSpeakers);
    status.classList.remove("error");

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
    this._modalOpen = true;
    this._form.speakers = [];
    this._form.message = "";
    this._form.volume = this._config.default_volume ?? 50;
    this._form.voice = this._config.default_voice || "en-US-AriaNeural";

    // Rebuild the modal HTML fresh so voice select reflects current default
    this._render();
    this._bind();

    this.shadowRoot.getElementById("overlay").classList.add("open");
    this._renderSpeakers();
    this._updateSendButton();

    setTimeout(() => {
      const msg = this.shadowRoot.getElementById("message");
      if (msg) msg.focus();
    }, 80);
  }

  _close() {
    this._modalOpen = false;
    const overlay = this.shadowRoot.getElementById("overlay");
    if (overlay) overlay.classList.remove("open");
  }

  _send() {
    const message = this._form.message.trim();
    const speakers = [...this._form.speakers];
    if (!message || !speakers.length) return;

    const btn = this.shadowRoot.getElementById("sendBtn");
    const status = this.shadowRoot.getElementById("status");
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.classList.remove("error");

    const done = (err) => {
      if (err) {
        btn.disabled = false;
        btn.textContent = "Send";
        status.classList.add("error");
        status.textContent = `Error: ${err.message || "Failed to send. Check Chime TTS service."}`;
      } else {
        this._close();
      }
    };

    try {
      const result = this._hass.callService(
        "chime_tts",
        "say",
        this._serviceData(message, speakers),
      );
      if (result && typeof result.then === "function") {
        result.then(() => done(null)).catch(done);
      } else {
        done(null);
      }
    } catch (err) {
      done(err);
    }
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
  .editor {
    padding: 8px 0;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    color: var(--primary-text-color);
  }
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--secondary-text-color);
    display: block;
    margin-bottom: 6px;
  }
  .full-width {
    width: 100%;
  }

  ${NATIVE_SELECT_CSS}

  .volume-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .volume-row ha-slider { flex: 1; }
  .vol-val {
    min-width: 28px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
  }

  .speaker-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }
  /* entity select takes up remaining space */
  .speaker-row .native-select-wrap { flex: 1; min-width: 0; }
  .speaker-row ha-textfield { width: 130px; flex-shrink: 0; }

  .remove-btn {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    font-size: 18px;
    line-height: 32px;
    text-align: center;
    border-radius: 50%;
    transition: background 0.15s, color 0.15s;
  }
  .remove-btn:hover {
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
  }

  .speaker-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .editor-btn {
    padding: 7px 16px;
    border-radius: 4px;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .editor-btn.filled {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border: none;
  }
  .editor-btn.outlined {
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
  }
  .editor-btn:hover { opacity: 0.85; }

  .empty-state {
    font-size: 13px;
    color: var(--secondary-text-color);
    font-style: italic;
    padding: 6px 0;
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

  _entitySelectHTML(selectedId, entities, cssClass) {
    const opts = entities.map((e) => {
      const suffix = e.meta
        ? ` (${e.meta.label})`
        : e.platform
          ? ` (${e.platform})`
          : "";
      return `<option value="${e.entity_id}"${e.entity_id === selectedId ? " selected" : ""}>${e.name}${suffix}</option>`;
    });
    const needsMissing =
      selectedId && !entities.some((e) => e.entity_id === selectedId);
    if (needsMissing) {
      opts.unshift(
        `<option value="${selectedId}" selected>${selectedId}</option>`,
      );
    }
    return `
      <div class="native-select-wrap">
        <select class="${cssClass || ""}">
          <option value="">— Select entity —</option>
          ${opts.join("")}
        </select>
      </div>`;
  }

  _render() {
    const voice = this._config.default_voice || "en-US-AriaNeural";
    const volume = this._config.default_volume ?? 50;
    const speakers = this._config.speakers || [];
    const entities = this._getMediaPlayers();
    this._entitiesKey = this._mediaPlayersKey(entities);

    const voiceOptions = VOICES.map(
      (v) =>
        `<option value="${v.id}"${v.id === voice ? " selected" : ""}>${v.label} — ${v.desc}</option>`,
    ).join("");

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLE}</style>
      <div class="editor">

        <div class="section">
          <label class="section-title">Default Voice</label>
          <div class="native-select-wrap">
            <select id="voice">${voiceOptions}</select>
          </div>
        </div>

        <div class="section">
          <label class="section-title">Default Volume — <span id="volumeDisplay">${volume}</span>%</label>
          <div class="volume-row">
            <ha-slider id="volume" min="0" max="100" value="${volume}" step="1" pin></ha-slider>
          </div>
        </div>

        <div class="section">
          <label class="section-title">Speakers</label>
          <div id="speakersContainer">
            ${
              speakers.length === 0
                ? '<div class="empty-state">No speakers configured. Add one below or auto-discover.</div>'
                : speakers
                    .map((sp, i) => this._speakerRowHTML(sp, i, entities))
                    .join("")
            }
          </div>
          <div class="speaker-actions">
            <button class="editor-btn filled" id="addSpeaker">Add Speaker</button>
            <button class="editor-btn outlined" id="autoDiscover">
              ${entities.length > 0 ? `Auto-discover (${entities.length})` : "Auto-discover"}
            </button>
          </div>
        </div>

      </div>
    `;

    this._bindEditor();
  }

  _speakerRowHTML(speaker, index, entities) {
    const name = (speaker.name || "").replace(/"/g, "&quot;");
    return `
      <div class="speaker-row" data-index="${index}">
        ${this._entitySelectHTML(speaker.entity || "", entities, "entity-select")}
        <ha-textfield class="name-input" label="Label" value="${name}" style="width:130px;flex-shrink:0"></ha-textfield>
        <button class="remove-btn" title="Remove" aria-label="Remove speaker">✕</button>
      </div>`;
  }

  _bindEditor() {
    const shadow = this.shadowRoot;

    // Voice — native select, always works
    const voiceEl = shadow.getElementById("voice");
    if (voiceEl) {
      voiceEl.addEventListener("change", (e) => {
        this._config.default_voice = e.target.value;
        this._fireConfigChanged();
      });
    }

    // Volume
    const volumeEl = shadow.getElementById("volume");
    if (volumeEl) {
      volumeEl.addEventListener("input", () => {
        const val = parseInt(volumeEl.value, 10);
        this._config.default_volume = val;
        const disp = shadow.getElementById("volumeDisplay");
        if (disp) disp.textContent = val;
        this._fireConfigChanged();
      });
    }

    this._bindSpeakerRows();

    shadow
      .getElementById("addSpeaker")
      ?.addEventListener("click", () => this._onAddSpeaker());
    shadow
      .getElementById("autoDiscover")
      ?.addEventListener("click", () => this._onAutoDiscover());
  }

  _bindSpeakerRows() {
    this.shadowRoot.querySelectorAll(".entity-select").forEach((el) => {
      el.addEventListener("change", () => this._onEntityChange(el));
    });
    this.shadowRoot.querySelectorAll(".name-input").forEach((el) => {
      el.addEventListener("input", () => this._onNameChange(el));
    });
    this.shadowRoot.querySelectorAll(".remove-btn").forEach((el) => {
      el.addEventListener("click", () => this._onRemoveSpeaker(el));
    });
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

  _onRemoveSpeaker(btnEl) {
    const index = this._rowIndex(btnEl);
    if (index < 0) return;
    const speakers = this._config.speakers || [];
    speakers.splice(index, 1);
    this._config.speakers = speakers.length ? speakers : undefined;
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _onAddSpeaker() {
    const speakers = this._config.speakers || [];
    speakers.push({ entity: "", name: "" });
    this._config.speakers = speakers;
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _onAutoDiscover() {
    const entities = this._getMediaPlayers();
    this._config.speakers = entities.map((e) => ({
      entity: e.entity_id,
      name: e.name,
    }));
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _reRenderSpeakerRows() {
    const container = this.shadowRoot.getElementById("speakersContainer");
    if (!container) return;
    const speakers = this._config.speakers || [];
    const entities = this._getMediaPlayers();
    container.innerHTML =
      speakers.length === 0
        ? '<div class="empty-state">No speakers configured. Add one below or auto-discover.</div>'
        : speakers
            .map((sp, i) => this._speakerRowHTML(sp, i, entities))
            .join("");
    this._bindSpeakerRows();
  }

  _fireConfigChanged() {
    const config = {
      type: this._config.type || "custom:tts-announce-card",
      default_voice: this._config.default_voice || "en-US-AriaNeural",
      default_volume: this._config.default_volume ?? 50,
    };
    if (this._config.speakers?.length) {
      config.speakers = this._config.speakers
        .filter((s) => s.entity)
        .map((s) => ({ entity: s.entity, name: s.name || s.entity }));
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
