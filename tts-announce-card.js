const VOICES = [
  { id: 'en-US-AriaNeural', label: 'Aria (US Female, warm)' },
  { id: 'en-US-JennyNeural', label: 'Jenny (US Female, clear)' },
  { id: 'en-US-GuyNeural', label: 'Guy (US Male, natural)' },
  { id: 'en-US-DavisNeural', label: 'Davis (US Male, casual)' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha (AU Female)' },
  { id: 'en-AU-WilliamNeural', label: 'William (AU Male)' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia (GB Female)' },
  { id: 'en-GB-RyanNeural', label: 'Ryan (GB Male)' },
  { id: 'en-IE-EmilyNeural', label: 'Emily (IE Female)' },
  { id: 'en-ZA-LeahNeural', label: 'Leah (ZA Female)' },
];

const DEFAULT_SPEAKERS = [
  { entity: 'media_player.kitchen', name: 'Kitchen' },
  { entity: 'media_player.move', name: 'Move' },
  { entity: 'media_player.main_bedroom', name: 'Main Bedroom' },
  { entity: 'media_player.study', name: 'Study' },
  { entity: 'media_player.tv_room', name: 'TV Room' },
];

const CARD_STYLE = `
  :host { display: block; }
  .trigger-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    user-select: none;
  }
  .trigger-content:hover { background: var(--secondary-background-color); }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .overlay.open { display: flex; }

  .modal {
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalIn 0.2s ease-out;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .modal-header {
    padding: 20px 24px 0;
    font-size: 20px;
    font-weight: 500;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    color: var(--primary-text-color);
  }
  .modal-body { padding: 8px 24px 16px; }
  .modal-footer {
    padding: 8px 24px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .field { margin-top: 16px; }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
  }

  .speakers-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  ha-icon[icon="mdi:microphone"] {
    --mdc-icon-size: 24px;
    color: var(--text-primary-color);
    background: var(--primary-color);
    border-radius: 50%;
    padding: 8px;
    box-sizing: content-box;
  }

  .volume-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .volume-row ha-slider { flex: 1; }
  .volume-value {
    min-width: 32px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color);
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
  }

  .status {
    font-size: 13px;
    color: var(--secondary-text-color);
    text-align: center;
    margin-top: 16px;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
  }
`;

class TTSAnnounceCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._modalOpen = false;
    this._form = { message: '', volume: 50, voice: 'en-US-AriaNeural', speakers: [] };
    this._render();
    this._bind();
  }

  disconnectedCallback() {
    if (this._keydownHandler) {
      window.removeEventListener('keydown', this._keydownHandler);
    }
  }

  set hass(hass) { this._hass = hass; }

  set config(config) {
    this._config = config;
    if (config.default_volume != null) this._form.volume = config.default_volume;
    if (config.default_voice) this._form.voice = config.default_voice;
    this._renderSpeakers();
    this._syncForm();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLE}</style>
      <ha-card id="trigger" tabindex="0" role="button" aria-label="Open announce">
        <div class="trigger-content">
          <ha-icon icon="mdi:microphone"></ha-icon>
          <span style="font-size:16px;font-weight:500;font-family:var(--primary-font-family,'Roboto',sans-serif);color:var(--primary-text-color)">Announce</span>
        </div>
      </ha-card>
      <div class="overlay" id="overlay">
        <ha-card class="modal">
          <div class="modal-header">Send Announcement</div>
          <div class="modal-body">
            <ha-textfield
              id="message"
              label="Message"
              placeholder="Type your announcement..."
              multiline
              maxlength="500"
            ></ha-textfield>

            <div class="field">
              <div class="field-label">Volume</div>
              <div class="volume-row">
                <ha-slider id="volume" min="0" max="100" value="${this._form.volume}" step="1" pin></ha-slider>
                <span class="volume-value" id="volumeDisplay">${this._form.volume}</span>
              </div>
            </div>

            <div class="field">
              <div class="field-label">Voice</div>
              <ha-select id="voice" label="Voice">
                ${VOICES.map(v => `<ha-list-item value="${v.id}"${v.id === this._form.voice ? ' selected' : ''}>${v.label}</ha-list-item>`).join('')}
              </ha-select>
            </div>

            <div class="field">
              <div class="field-label">Speakers</div>
              <div class="speakers-grid" id="speakers"></div>
            </div>

            <div class="status" id="status">Select at least one speaker and enter a message</div>
          </div>
          <div class="modal-footer">
            <mwc-button id="cancelBtn">Cancel</mwc-button>
            <mwc-button id="sendBtn" raised disabled>Send</mwc-button>
          </div>
        </ha-card>
      </div>
    `;
  }

  _bind() {
    const s = (id) => this.shadowRoot.getElementById(id);

    s('trigger').addEventListener('click', () => this._open());
    s('trigger').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._open(); }
    });
    s('overlay').addEventListener('click', (e) => {
      if (e.target === s('overlay')) this._close();
    });
    s('cancelBtn').addEventListener('click', () => this._close());

    s('message').addEventListener('input', () => {
      this._form.message = s('message').value;
      this._updateSendButton();
    });

    s('volume').addEventListener('input', () => {
      this._form.volume = parseInt(s('volume').value, 10);
      s('volumeDisplay').textContent = this._form.volume;
    });

    s('voice').addEventListener('change', () => {
      this._form.voice = s('voice').value;
    });

    s('sendBtn').addEventListener('click', () => this._send());

    window.addEventListener('keydown', this._keydownHandler = (e) => {
      if (e.key === 'Escape' && this._modalOpen) this._close();
    });
  }

  _speakerEntities() {
    return this._config.speakers?.length ? this._config.speakers : DEFAULT_SPEAKERS;
  }

  _renderSpeakers() {
    const container = this.shadowRoot.getElementById('speakers');
    if (!container) return;
    const active = this._form.speakers;
    const speakers = this._speakerEntities();
    container.innerHTML = speakers.map(s => {
      const selected = active.includes(s.entity);
      return `<mwc-button unelevated class="speaker-btn${selected ? ' selected' : ''}" data-entity="${s.entity}" dense>${s.name}</mwc-button>`;
    }).join('');

    const style = document.createElement('style');
    style.textContent = `
      mwc-button.speaker-btn.selected { --mdc-theme-primary: var(--primary-color); }
      mwc-button.speaker-btn:not(.selected) {
        --mdc-theme-primary: var(--primary-text-color);
        --mdc-button-outline-color: var(--divider-color);
        --mdc-text-button-hover-state-layer-color: transparent;
        --mdc-text-button-focus-state-layer-color: transparent;
      }
    `;
    container.appendChild(style);

    container.querySelectorAll('.speaker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const entity = btn.dataset.entity;
        const idx = this._form.speakers.indexOf(entity);
        if (idx >= 0) {
          this._form.speakers.splice(idx, 1);
        } else {
          this._form.speakers.push(entity);
        }
        this._renderSpeakers();
        this._updateSendButton();
      });
    });
  }

  _updateSendButton() {
    const btn = this.shadowRoot.getElementById('sendBtn');
    const status = this.shadowRoot.getElementById('status');
    const hasMessage = this._form.message.trim().length > 0;
    const hasSpeakers = this._form.speakers.length > 0;
    btn.disabled = !(hasMessage && hasSpeakers);
    if (!hasMessage && !hasSpeakers) {
      status.textContent = 'Enter a message and select at least one speaker';
    } else if (!hasMessage) {
      status.textContent = 'Enter a message';
    } else if (!hasSpeakers) {
      status.textContent = 'Select at least one speaker';
    } else {
      const names = this._speakerEntities()
        .filter(s => this._form.speakers.includes(s.entity))
        .map(s => s.name);
      status.textContent = `Ready: ${names.join(', ')}`;
    }
  }

  _syncForm() {
    const s = (id) => this.shadowRoot.getElementById(id);
    const msg = s('message');
    const vol = s('volume');
    const vd = s('volumeDisplay');
    const vo = s('voice');
    if (msg) msg.value = this._form.message;
    if (vol) vol.value = this._form.volume;
    if (vd) vd.textContent = this._form.volume;
    if (vo) vo.value = this._form.voice;
    this._updateSendButton();
    this._renderSpeakers();
  }

  _open() {
    this._modalOpen = true;
    this._form.speakers = [];
    this._form.message = '';
    this._form.volume = this._config.default_volume ?? 50;
    this._form.voice = this._config.default_voice || 'en-US-AriaNeural';
    this._syncForm();
    this.shadowRoot.getElementById('overlay').classList.add('open');
    setTimeout(() => {
      const msg = this.shadowRoot.getElementById('message');
      if (msg) msg.focus();
    }, 150);
  }

  _close() {
    this._modalOpen = false;
    this.shadowRoot.getElementById('overlay').classList.remove('open');
  }

  _send() {
    const message = this._form.message.trim();
    const speakers = [...this._form.speakers];
    if (!message || !speakers.length) return;
    const btn = this.shadowRoot.getElementById('sendBtn');
    btn.disabled = true;
    btn.label = 'Sending...';
    this._hass.callService('script', 'tts_run', {
      message,
      volume: this._form.volume,
      voice: this._form.voice,
      speakers,
    }).then(() => {
      this._close();
    }).catch(() => {
      btn.disabled = false;
      btn.label = 'Send';
      this.shadowRoot.getElementById('status').textContent = 'Failed to send. Check the script name and try again.';
    });
  }

  static getConfigElement() {
    return document.createElement('tts-announce-card-editor');
  }

  static getStubConfig() {
    return {
      default_voice: 'en-US-AriaNeural',
      default_volume: 50,
      speakers: DEFAULT_SPEAKERS,
    };
  }
}

customElements.define('tts-announce-card', TTSAnnounceCard);

const EDITOR_STYLE = `
  :host { display: block; }
  .editor {
    padding: 8px 0;
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
    color: var(--primary-text-color);
  }
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
    display: block;
    margin-bottom: 4px;
  }
  .section > ha-select { width: 100%; }
  .section > ha-textfield { width: 100%; }

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
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .speaker-row ha-select { flex: 1; min-width: 0; }
  .speaker-row ha-textfield { width: 140px; flex-shrink: 0; }
  .speaker-row ha-icon-button { flex-shrink: 0; --ha-icon-button-size: 36px; }

  .speaker-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
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
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  set config(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    this._render();
  }

  _getMediaPlayers() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(id => id.startsWith('media_player.'))
      .map(id => ({
        entity_id: id,
        name: this._hass.states[id].attributes.friendly_name || id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  _render() {
    const voice = this._config.default_voice || 'en-US-AriaNeural';
    const volume = this._config.default_volume ?? 50;
    const speakers = this._config.speakers || [];
    const entities = this._getMediaPlayers();

    this.shadowRoot.innerHTML = `
      <style>${EDITOR_STYLE}</style>
      <div class="editor">
        <div class="section">
          <label class="section-title">Default Voice</label>
          <ha-select id="voice" label="Voice">
            ${VOICES.map(v =>
              `<ha-list-item value="${v.id}"${v.id === voice ? ' selected' : ''}>${v.label}</ha-list-item>`
            ).join('')}
          </ha-select>
        </div>

        <div class="section">
          <label class="section-title">Default Volume</label>
          <div class="volume-row">
            <ha-slider id="volume" min="0" max="100" value="${volume}" step="1" pin></ha-slider>
            <span class="vol-val" id="volumeDisplay">${volume}</span>
          </div>
        </div>

        <div class="section">
          <label class="section-title">Speakers</label>
          <div id="speakersContainer">
            ${speakers.length === 0
              ? '<div class="empty-state">No speakers configured. Add one below or auto-discover your media players.</div>'
              : speakers.map((s, i) => this._speakerRowHTML(s, i, entities)).join('')
            }
          </div>
          <div class="speaker-actions">
            <mwc-button unelevated id="addSpeaker">Add Speaker</mwc-button>
            <mwc-button outlined id="autoDiscover">${entities.length > 0 ? `Auto-discover (${entities.length})` : 'Auto-discover'}</mwc-button>
          </div>
        </div>
      </div>
    `;

    this._bind();
  }

  _speakerRowHTML(speaker, index, entities) {
    const selected = speaker.entity || '';
    const name = speaker.name || '';
    const options = entities.map(e =>
      `<ha-list-item value="${e.entity_id}"${e.entity_id === selected ? ' selected' : ''}>${e.name}</ha-list-item>`
    ).join('');
    const currentInList = entities.some(e => e.entity_id === selected);
    return `
      <div class="speaker-row" data-index="${index}">
        <ha-select class="entity-select" label="Entity">
          <ha-list-item value="">— Select entity —</ha-list-item>
          ${options}
          ${!currentInList && selected ? `<ha-list-item value="${selected}" selected>${selected}</ha-list-item>` : ''}
        </ha-select>
        <ha-textfield class="name-input" label="Name" value="${name.replace(/"/g, '&quot;')}"></ha-textfield>
        <ha-icon-button class="remove-btn" icon="mdi:close" title="Remove speaker"></ha-icon-button>
      </div>
    `;
  }

  _bind() {
    const shadow = this.shadowRoot;

    shadow.getElementById('voice').addEventListener('change', () => {
      this._config.default_voice = shadow.getElementById('voice').value;
      this._fireConfigChanged();
    });

    shadow.getElementById('volume').addEventListener('input', () => {
      const val = parseInt(shadow.getElementById('volume').value, 10);
      this._config.default_volume = val;
      shadow.getElementById('volumeDisplay').textContent = val;
      this._fireConfigChanged();
    });

    this._bindSpeakerRows();
    shadow.getElementById('addSpeaker').addEventListener('click', () => this._onAddSpeaker());
    shadow.getElementById('autoDiscover').addEventListener('click', () => this._onAutoDiscover());
  }

  _bindSpeakerRows() {
    const shadow = this.shadowRoot;
    shadow.querySelectorAll('.entity-select').forEach(el => {
      el.addEventListener('change', () => this._onEntityChange(el));
    });
    shadow.querySelectorAll('.name-input').forEach(el => {
      el.addEventListener('input', () => this._onNameChange(el));
    });
    shadow.querySelectorAll('.remove-btn').forEach(el => {
      el.addEventListener('click', () => this._onRemoveSpeaker(el));
    });
  }

  _onEntityChange(selectEl) {
    const row = selectEl.closest('.speaker-row');
    if (!row) return;
    const index = parseInt(row.dataset.index, 10);
    const entity = selectEl.value;
    const speakers = this._config.speakers || [];
    if (!speakers[index]) return;
    speakers[index].entity = entity;
    if (entity && this._hass && this._hass.states[entity]) {
      const fn = this._hass.states[entity].attributes.friendly_name;
      if (fn) speakers[index].name = fn;
    }
    this._config.speakers = speakers;
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _onNameChange(inputEl) {
    const row = inputEl.closest('.speaker-row');
    if (!row) return;
    const index = parseInt(row.dataset.index, 10);
    const speakers = this._config.speakers || [];
    if (!speakers[index]) return;
    speakers[index].name = inputEl.value;
    this._config.speakers = speakers;
    this._fireConfigChanged();
  }

  _onRemoveSpeaker(btnEl) {
    const row = btnEl.closest('.speaker-row');
    if (!row) return;
    const index = parseInt(row.dataset.index, 10);
    const speakers = this._config.speakers || [];
    speakers.splice(index, 1);
    this._config.speakers = speakers.length ? speakers : undefined;
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _onAddSpeaker() {
    const speakers = this._config.speakers || [];
    speakers.push({ entity: '', name: '' });
    this._config.speakers = speakers;
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _onAutoDiscover() {
    const entities = this._getMediaPlayers();
    this._config.speakers = entities.map(e => ({
      entity: e.entity_id,
      name: e.name,
    }));
    this._reRenderSpeakerRows();
    this._fireConfigChanged();
  }

  _reRenderSpeakerRows() {
    const container = this.shadowRoot.getElementById('speakersContainer');
    if (!container) return;
    const speakers = this._config.speakers || [];
    const entities = this._getMediaPlayers();
    container.innerHTML = speakers.length === 0
      ? '<div class="empty-state">No speakers configured. Add one below or auto-discover your media players.</div>'
      : speakers.map((s, i) => this._speakerRowHTML(s, i, entities)).join('');
    this._bindSpeakerRows();
  }

  _fireConfigChanged() {
    const config = {};
    if (this._config.default_voice && this._config.default_voice !== 'en-US-AriaNeural') {
      config.default_voice = this._config.default_voice;
    }
    if (this._config.default_volume != null && this._config.default_volume !== 50) {
      config.default_volume = this._config.default_volume;
    }
    if (this._config.speakers?.length) {
      config.speakers = this._config.speakers.map(s => ({ entity: s.entity, name: s.name }));
    }
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('tts-announce-card-editor', TTSAnnounceCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'tts-announce-card',
  name: 'TTS Announce Card',
  description: 'Send voice announcements to media players with volume, voice, and speaker selection.',
  preview: false,
});
