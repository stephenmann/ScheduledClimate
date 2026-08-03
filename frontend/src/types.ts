export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    current_temperature?: number;
    temperature?: number;
    target_temp_low?: number;
    target_temp_high?: number;
    humidity?: number;
    current_humidity?: number;
    hvac_action?: string;
    hvac_modes?: string[];
    preset_mode?: string;
    preset_modes?: string[];
    fan_mode?: string;
    fan_modes?: string[];
    swing_mode?: string;
    swing_modes?: string[];
    swing_horizontal_mode?: string;
    swing_horizontal_modes?: string[];
    min_temp?: number;
    max_temp?: number;
    target_temp_step?: number;
    min_humidity?: number;
    max_humidity?: number;
    schedule_enabled?: boolean;
    schedule_on_time?: string | null;
    schedule_off_time?: string | null;
    next_schedule_action?: string | null;
    next_schedule_time?: string | null;
    timer_action?: string | null;
    timer_deadline?: string | null;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface ScheduledClimateCardConfig {
  type: "custom:scheduled-climate-card";
  entity: string;
  name?: string;
  show_schedule?: boolean;
  show_timer?: boolean;
  timer_presets?: number[];
}

export const DEFAULT_PRESETS = [15, 30, 60, 120];
