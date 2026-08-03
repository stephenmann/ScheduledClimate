import { LitElement, css, html, nothing } from "lit";
import "./scheduled-climate-card-editor";
import type { HassEntity, HomeAssistant, ScheduledClimateCardConfig } from "./types";
import { DEFAULT_PRESETS } from "./types";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

const UNAVAILABLE = new Set(["unavailable", "unknown"]);

export class ScheduledClimateCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _busy: { state: true },
    _message: { state: true },
    _scheduleEnabled: { state: true },
    _onTime: { state: true },
    _offTime: { state: true },
    _timerMinutes: { state: true },
  };

  hass?: HomeAssistant;
  private _config?: ScheduledClimateCardConfig;
  private _busy = false;
  private _message = "";
  private _scheduleEnabled = false;
  private _onTime = "";
  private _offTime = "";
  private _timerMinutes = 30;
  private _scheduleSignature = "";

  static getConfigElement(): HTMLElement {
    return document.createElement("scheduled-climate-card-editor");
  }

  static getStubConfig(): ScheduledClimateCardConfig {
    return {
      type: "custom:scheduled-climate-card",
      entity: "",
      show_schedule: true,
      show_timer: true,
      timer_presets: DEFAULT_PRESETS,
    };
  }

  setConfig(config: ScheduledClimateCardConfig): void {
    if (!config.entity) throw new Error("Scheduled Climate Card requires an entity");
    this._config = {
      show_schedule: true,
      show_timer: true,
      timer_presets: DEFAULT_PRESETS,
      ...config,
    };
  }

  getCardSize(): number {
    return 7;
  }

  protected willUpdate(): void {
    const state = this._state;
    if (!state) return;
    const attrs = state.attributes;
    const signature = [
      attrs.schedule_enabled,
      attrs.schedule_on_time,
      attrs.schedule_off_time,
    ].join("|");
    if (signature !== this._scheduleSignature) {
      this._scheduleSignature = signature;
      this._scheduleEnabled = Boolean(attrs.schedule_enabled);
      this._onTime = this._shortTime(attrs.schedule_on_time);
      this._offTime = this._shortTime(attrs.schedule_off_time);
    }
  }

  private get _state(): HassEntity | undefined {
    return this._config && this.hass?.states[this._config.entity];
  }

  private _shortTime(value?: string | null): string {
    return value ? value.slice(0, 5) : "";
  }

  private async _call(
    domain: string,
    service: string,
    data: Record<string, unknown> = {},
  ): Promise<boolean> {
    if (!this.hass || !this._config || this._busy) return false;
    this._busy = true;
    this._message = "";
    try {
      await this.hass.callService(domain, service, {
        entity_id: this._config.entity,
        ...data,
      });
      this._message = "Saved";
      return true;
    } catch (error) {
      this._message = error instanceof Error ? error.message : "Command failed";
      return false;
    } finally {
      this._busy = false;
    }
  }

  private _formatValue(value: unknown, suffix = ""): string {
    return typeof value === "number" ? `${value}${suffix}` : "--";
  }

  private _renderSelect(
    label: string,
    value: string | undefined,
    values: string[] | undefined,
    service: string,
    field: string,
  ) {
    if (!values?.length) return nothing;
    return html`
      <label class="field">
        <span>${label}</span>
        <select
          .value=${value ?? ""}
          ?disabled=${this._busy}
          @change=${(event: Event) =>
            this._call("climate", service, {
              [field]: (event.target as HTMLSelectElement).value,
            })}
        >
          ${values.map((item) => html`<option value=${item}>${item.replaceAll("_", " ")}</option>`)}
        </select>
      </label>
    `;
  }

  private _renderClimate(state: HassEntity) {
    const attrs = state.attributes;
    const unit = String(attrs.unit_of_measurement ?? "°");
    const modes = attrs.hvac_modes ?? [];
    const target = attrs.temperature;
    const targetLow = attrs.target_temp_low;
    const targetHigh = attrs.target_temp_high;
    const step = attrs.target_temp_step ?? 0.5;

    return html`
      <section class="climate" aria-label="Climate controls">
        <div class="temperature">
          <div>
            <span class="current">${this._formatValue(attrs.current_temperature, unit)}</span>
            <span class="caption">Current</span>
          </div>
          ${typeof target === "number"
            ? html`
                <label class="target">
                  <span class="caption">Target</span>
                  <input
                    type="number"
                    .value=${String(target)}
                    min=${attrs.min_temp ?? 7}
                    max=${attrs.max_temp ?? 35}
                    step=${step}
                    ?disabled=${this._busy}
                    @change=${(event: Event) =>
                      this._call("climate", "set_temperature", {
                        temperature: Number((event.target as HTMLInputElement).value),
                      })}
                  />
                  <span>${unit}</span>
                </label>
              `
            : typeof targetLow === "number" && typeof targetHigh === "number"
              ? html`
                  <div class="range-target" aria-label="Target temperature range">
                    <label>
                      <span class="caption">Low</span>
                      <input
                        type="number"
                        .value=${String(targetLow)}
                        min=${attrs.min_temp ?? 7}
                        max=${targetHigh}
                        step=${step}
                        ?disabled=${this._busy}
                        @change=${(event: Event) =>
                          this._call("climate", "set_temperature", {
                            target_temp_low: Number((event.target as HTMLInputElement).value),
                            target_temp_high: targetHigh,
                          })}
                      />
                    </label>
                    <span>–</span>
                    <label>
                      <span class="caption">High</span>
                      <input
                        type="number"
                        .value=${String(targetHigh)}
                        min=${targetLow}
                        max=${attrs.max_temp ?? 35}
                        step=${step}
                        ?disabled=${this._busy}
                        @change=${(event: Event) =>
                          this._call("climate", "set_temperature", {
                            target_temp_low: targetLow,
                            target_temp_high: Number((event.target as HTMLInputElement).value),
                          })}
                      />
                    </label>
                    <span>${unit}</span>
                  </div>
                `
            : nothing}
        </div>
        ${attrs.hvac_action
          ? html`<div class="status"><span class="pulse"></span>${attrs.hvac_action.replaceAll("_", " ")}</div>`
          : nothing}
        <div class="modes" role="group" aria-label="HVAC mode">
          ${modes.map(
            (mode) => html`
              <button
                class=${state.state === mode ? "selected" : ""}
                ?disabled=${this._busy}
                aria-pressed=${state.state === mode}
                @click=${() => this._call("climate", "set_hvac_mode", { hvac_mode: mode })}
              >${mode.replaceAll("_", " ")}</button>
            `,
          )}
        </div>
        <div class="control-grid">
          ${this._renderSelect("Preset", attrs.preset_mode, attrs.preset_modes, "set_preset_mode", "preset_mode")}
          ${this._renderSelect("Fan", attrs.fan_mode, attrs.fan_modes, "set_fan_mode", "fan_mode")}
          ${this._renderSelect("Swing", attrs.swing_mode, attrs.swing_modes, "set_swing_mode", "swing_mode")}
          ${this._renderSelect(
            "Horizontal swing",
            attrs.swing_horizontal_mode,
            attrs.swing_horizontal_modes,
            "set_swing_horizontal_mode",
            "swing_horizontal_mode",
          )}
          ${typeof attrs.humidity === "number"
            ? html`
                <label class="field">
                  <span>Humidity</span>
                  <input
                    type="number"
                    .value=${String(attrs.humidity)}
                    min=${attrs.min_humidity ?? 30}
                    max=${attrs.max_humidity ?? 99}
                    ?disabled=${this._busy}
                    @change=${(event: Event) =>
                      this._call("climate", "set_humidity", {
                        humidity: Number((event.target as HTMLInputElement).value),
                      })}
                  />
                </label>
              `
            : nothing}
        </div>
      </section>
    `;
  }

  private _renderSchedule(state: HassEntity) {
    const nextAction = this._scheduleEnabled
      ? state.attributes.next_schedule_action
      : null;
    const nextTime = this._scheduleEnabled
      ? state.attributes.next_schedule_time
      : null;
    return html`
      <section aria-labelledby="schedule-heading">
        <div class="section-heading">
          <div>
            <h3 id="schedule-heading">Daily schedule</h3>
            <p>${nextAction && nextTime ? `Next ${nextAction} · ${new Date(nextTime).toLocaleString()}` : "No action scheduled"}</p>
          </div>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${this._scheduleEnabled}
              ?disabled=${this._busy}
              @change=${(event: Event) =>
                this._scheduleEnabledChanged(
                  (event.target as HTMLInputElement).checked,
                )}
            />
            <span>Enabled</span>
          </label>
        </div>
        <div class="schedule-grid">
          <label class="field"><span>On time</span><input type="time" .value=${this._onTime} @input=${(event: Event) => (this._onTime = (event.target as HTMLInputElement).value)} /></label>
          <label class="field"><span>Off time</span><input type="time" .value=${this._offTime} @input=${(event: Event) => (this._offTime = (event.target as HTMLInputElement).value)} /></label>
          <button class="primary" ?disabled=${this._busy} @click=${() => this._call("scheduled_climate", "update_schedule", {
            schedule_enabled: this._scheduleEnabled,
            on_time: this._onTime || null,
            off_time: this._offTime || null,
          })}><ha-icon icon="mdi:content-save-outline"></ha-icon>Save</button>
        </div>
      </section>
    `;
  }

  private async _scheduleEnabledChanged(enabled: boolean): Promise<void> {
    const previousOnTime = this._onTime;
    const previousOffTime = this._offTime;
    this._scheduleEnabled = enabled;
    if (enabled) return;

    this._onTime = "";
    this._offTime = "";
    if (
      !(await this._call("scheduled_climate", "update_schedule", {
        schedule_enabled: false,
        on_time: null,
        off_time: null,
      }))
    ) {
      this._scheduleEnabled = true;
      this._onTime = previousOnTime;
      this._offTime = previousOffTime;
    }
  }

  private _renderTimer(state: HassEntity) {
    const action = state.attributes.timer_action;
    const deadline = state.attributes.timer_deadline;
    const presets = this._config?.timer_presets ?? DEFAULT_PRESETS;
    return html`
      <section aria-labelledby="timer-heading">
        <div class="section-heading">
          <div><h3 id="timer-heading">Timer</h3><p>${action && deadline ? `${action} at ${new Date(deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active timer"}</p></div>
          ${action ? html`<button class="icon" title="Cancel timer" aria-label="Cancel timer" @click=${() => this._call("scheduled_climate", "cancel_timer")}><ha-icon icon="mdi:timer-off-outline"></ha-icon></button>` : nothing}
        </div>
        <div class="presets" aria-label="Timer presets">
          ${presets.map((minutes) => html`<button class=${this._timerMinutes === minutes ? "selected" : ""} @click=${() => (this._timerMinutes = minutes)}>${minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}</button>`)}
          <label class="custom-time"><span>Minutes</span><input type="number" min="1" step="1" .value=${String(this._timerMinutes)} @input=${(event: Event) => (this._timerMinutes = Math.max(1, Number((event.target as HTMLInputElement).value)))} /></label>
        </div>
        <div class="timer-actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._startTimer("on")}><ha-icon icon="mdi:power"></ha-icon>Turn on later</button>
          <button ?disabled=${this._busy} @click=${() => this._startTimer("off")}><ha-icon icon="mdi:power-off"></ha-icon>Turn off later</button>
        </div>
      </section>
    `;
  }

  private _startTimer(action: "on" | "off"): void {
    const seconds = Math.round(this._timerMinutes * 60);
    void this._call("scheduled_climate", `start_${action}_timer`, {
      duration: { seconds },
    });
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    const state = this._state;
    if (!state) return html`<ha-card><div class="empty">Entity not found</div></ha-card>`;
    const unavailable = UNAVAILABLE.has(state.state);
    const title = this._config.name ?? state.attributes.friendly_name ?? "Scheduled Climate";

    return html`
      <ha-card>
        <header><div><h2>${title}</h2><p>${unavailable ? "Unavailable" : state.state.replaceAll("_", " ")}</p></div><ha-icon icon="mdi:thermostat"></ha-icon></header>
        ${unavailable ? html`<div class="empty">The climate entity is unavailable.</div>` : this._renderClimate(state)}
        ${!unavailable && this._config.show_schedule !== false ? this._renderSchedule(state) : nothing}
        ${!unavailable && this._config.show_timer !== false ? this._renderTimer(state) : nothing}
        ${this._message ? html`<div class="message" role="status">${this._message}</div>` : nothing}
      </ha-card>
    `;
  }

  static styles = css`
    :host { display: block; color: var(--primary-text-color); }
    ha-card { overflow: hidden; border-radius: var(--ha-card-border-radius, 8px); }
    header, section { padding: 18px 20px; }
    header { display: flex; justify-content: space-between; align-items: center; background: color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color)); border-bottom: 1px solid var(--divider-color); }
    header ha-icon { --mdc-icon-size: 34px; color: var(--primary-color); }
    h2, h3, p { margin: 0; letter-spacing: 0; }
    h2 { font-size: 20px; line-height: 1.3; }
    h3 { font-size: 15px; line-height: 1.4; }
    p, .caption, .field > span, .custom-time > span { color: var(--secondary-text-color); font-size: 12px; }
    section + section { border-top: 1px solid var(--divider-color); }
    .temperature { display: flex; justify-content: space-between; align-items: end; gap: 20px; }
    .temperature > div { display: grid; }
    .current { font-size: 38px; line-height: 1; font-weight: 500; }
    .target { display: flex; align-items: center; gap: 6px; }
    .target .caption { margin-right: 4px; }
    .target input { width: 70px; font-size: 20px; font-weight: 500; text-align: right; }
    .range-target { display: flex; align-items: end; gap: 6px; }
    .range-target label { display: grid; gap: 3px; }
    .range-target input { width: 62px; text-align: right; }
    .status { display: flex; align-items: center; gap: 7px; margin-top: 12px; color: var(--secondary-text-color); font-size: 13px; text-transform: capitalize; }
    .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--state-climate-heat-color, var(--primary-color)); }
    .modes, .presets { display: flex; gap: 6px; overflow-x: auto; margin-top: 16px; padding-bottom: 2px; }
    button { min-height: 38px; padding: 8px 12px; border: 1px solid var(--divider-color); border-radius: 6px; color: var(--primary-text-color); background: var(--card-background-color); font: inherit; cursor: pointer; text-transform: capitalize; white-space: nowrap; }
    button:hover { background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color)); }
    button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    button.selected, button.primary { color: var(--text-primary-color, white); background: var(--primary-color); border-color: var(--primary-color); }
    button:disabled { opacity: .55; cursor: wait; }
    button ha-icon { --mdc-icon-size: 18px; margin-right: 6px; vertical-align: -4px; }
    .control-grid, .schedule-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
    .field { display: grid; gap: 5px; }
    input, select { box-sizing: border-box; min-width: 0; min-height: 40px; padding: 7px 9px; color: var(--primary-text-color); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px; font: inherit; }
    input[type="checkbox"] { accent-color: var(--primary-color); }
    .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .section-heading p { margin-top: 3px; }
    .switch { display: flex; align-items: center; gap: 7px; font-size: 13px; }
    .schedule-grid .primary { align-self: end; }
    .icon { width: 40px; padding: 7px; }
    .icon ha-icon { margin: 0; }
    .custom-time { display: flex; align-items: center; gap: 6px; margin-left: auto; }
    .custom-time input { width: 68px; }
    .timer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
    .message { padding: 10px 20px; border-top: 1px solid var(--divider-color); color: var(--secondary-text-color); font-size: 13px; }
    .empty { padding: 28px 20px; color: var(--secondary-text-color); text-align: center; }
    @media (max-width: 420px) {
      header, section { padding: 16px; }
      .control-grid, .schedule-grid { grid-template-columns: 1fr; }
      .timer-actions { grid-template-columns: 1fr; }
      .temperature { align-items: center; }
      .current { font-size: 32px; }
      .custom-time { margin-left: 0; }
    }
  `;
}

customElements.define("scheduled-climate-card", ScheduledClimateCard);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "scheduled-climate-card",
  name: "Scheduled Climate Card",
  description: "Climate controls with daily schedules and one-shot timers.",
  preview: true,
});
