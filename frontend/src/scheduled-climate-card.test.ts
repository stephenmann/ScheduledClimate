import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduledClimateCard } from "./scheduled-climate-card";
import { ScheduledClimateCardEditor } from "./scheduled-climate-card-editor";
import type {
  HassEntity,
  HomeAssistant,
  ScheduleItem,
  ScheduledClimateCardConfig,
} from "./types";

const ENTITY_ID = "climate.living_room_scheduled";
const SCHEDULE_ID = "living_room";

function schedule(): ScheduleItem {
  return {
    id: SCHEDULE_ID,
    name: "Living room",
    monday: [{ from: "07:00:00", to: "09:00:00", data: { temperature: 21 } }],
  };
}

function state(attributes: HassEntity["attributes"] = {}): HassEntity {
  return {
    entity_id: ENTITY_ID,
    state: "heat_cool",
    attributes: {
      friendly_name: "Living room",
      current_temperature: 21,
      target_temp_low: 19,
      target_temp_high: 23,
      min_temp: 7,
      max_temp: 35,
      target_temp_step: 0.5,
      supported_features: 1,
      hvac_modes: ["off", "heat_cool"],
      swing_horizontal_mode: "off",
      swing_horizontal_modes: ["off", "on"],
      schedule_enabled: true,
      schedule_entity_id: "schedule.living_room",
      schedule_id: SCHEDULE_ID,
      schedule_active: true,
      next_schedule_event: null,
      timer_action: null,
      timer_deadline: null,
      ...attributes,
    },
  };
}

async function renderCard(
  entityState = state(),
  callService = vi.fn().mockResolvedValue(undefined),
  callWS = vi.fn().mockResolvedValue([schedule()]),
): Promise<{
  card: ScheduledClimateCard;
  callService: ReturnType<typeof vi.fn>;
  callWS: ReturnType<typeof vi.fn>;
}> {
  const card = new ScheduledClimateCard();
  card.setConfig({
    type: "custom:scheduled-climate-card",
    entity: ENTITY_ID,
    default_schedule_day: "monday",
    timer_presets: [15, 30],
  });
  card.hass = {
    states: { [ENTITY_ID]: entityState },
    user: { is_admin: true },
    callService,
    callWS,
  } as unknown as HomeAssistant;
  document.body.append(card);
  await card.updateComplete;
  await vi.waitFor(() => expect(callWS).toHaveBeenCalled());
  await card.updateComplete;
  return { card, callService, callWS };
}

function button(card: ScheduledClimateCard, label: string): HTMLButtonElement {
  const match = [...card.shadowRoot!.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!match) throw new Error(`Button not found: ${label}`);
  return match;
}

function collapseButton(
  card: ScheduledClimateCard,
  section: string,
): HTMLButtonElement {
  const match = card.shadowRoot!.querySelector<HTMLButtonElement>(
    `button[aria-controls="${section}-controls"]`,
  );
  if (!match) throw new Error(`Collapse button not found: ${section}`);
  return match;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

describe("scheduled-climate-card", () => {
  it("renders native-style range and horizontal swing controls", async () => {
    const { card, callService } = await renderCard();
    const range = card.shadowRoot!.querySelector<HTMLElement>(".range-target")!;
    const controls = range.querySelectorAll<HTMLElement>(".number-control");
    const decreaseLow = range.querySelector<HTMLButtonElement>(
      'button[aria-label="Decrease low"]',
    )!;
    const horizontalSwing = [...card.shadowRoot!.querySelectorAll("label")].find(
      (label) => label.textContent?.includes("Horizontal swing"),
    )!.querySelector("select")!;

    expect(card.shadowRoot!.querySelector(".thermostat")).not.toBeNull();
    expect(controls).toHaveLength(2);
    expect(horizontalSwing.value).toBe("off");

    decreaseLow.click();
    await vi.waitFor(() =>
      expect(callService).toHaveBeenCalledWith("climate", "set_temperature", {
        entity_id: ENTITY_ID,
        target_temp_low: 18.5,
        target_temp_high: 23,
      }),
    );

    horizontalSwing.value = "on";
    horizontalSwing.dispatchEvent(new Event("change"));
    await vi.waitFor(() =>
      expect(callService).toHaveBeenCalledWith(
        "climate",
        "set_swing_horizontal_mode",
        { entity_id: ENTITY_ID, swing_horizontal_mode: "on" },
      ),
    );
  });

  it("renders compact mode without a dial and keeps touch controls", async () => {
    const callService = vi.fn().mockResolvedValue(undefined);
    const card = new ScheduledClimateCard();
    card.setConfig({
      type: "custom:scheduled-climate-card",
      entity: ENTITY_ID,
      layout: "compact",
    });
    card.hass = {
      states: { [ENTITY_ID]: state() },
      user: { is_admin: true },
      callService,
      callWS: vi.fn().mockResolvedValue([schedule()]),
    } as unknown as HomeAssistant;
    document.body.append(card);
    await card.updateComplete;

    expect(card.shadowRoot!.querySelector("ha-card")?.classList).toContain(
      "compact",
    );
    expect(card.shadowRoot!.querySelector(".thermostat")).toBeNull();
    expect(card.shadowRoot!.querySelector(".dial-ring")).toBeNull();
    expect(card.shadowRoot!.querySelector(".compact-status")?.textContent).toContain(
      "21°",
    );

    card.shadowRoot!
      .querySelector<HTMLButtonElement>('button[aria-label="Decrease low"]')!
      .click();
    await vi.waitFor(() =>
      expect(callService).toHaveBeenCalledWith("climate", "set_temperature", {
        entity_id: ENTITY_ID,
        target_temp_low: 18.5,
        target_temp_high: 23,
      }),
    );
  });

  it("selects compact mode in the visual editor", async () => {
    const editor = new ScheduledClimateCardEditor();
    const config: ScheduledClimateCardConfig = {
      type: "custom:scheduled-climate-card",
      entity: ENTITY_ID,
    };
    editor.setConfig(config);
    editor.hass = {
      states: { [ENTITY_ID]: state() },
      callService: vi.fn(),
      callWS: vi.fn(),
    } as unknown as HomeAssistant;
    const listener = vi.fn();
    editor.addEventListener("config-changed", listener);
    document.body.append(editor);
    await editor.updateComplete;

    const layout = editor.shadowRoot!.querySelector<HTMLSelectElement>(
      'select[name="layout"]',
    )!;
    expect(layout.value).toBe("standard");
    layout.value = "compact";
    layout.dispatchEvent(new Event("change"));

    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0][0] as CustomEvent).detail.config.layout).toBe(
      "compact",
    );
  });

  it("opens native more information for the configured entity", async () => {
    const { card } = await renderCard();
    const listener = vi.fn();
    card.addEventListener("hass-more-info", listener);

    button(card, "").click();

    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      entityId: ENTITY_ID,
    });
  });

  it("persists independent collapse state for each entity", async () => {
    const { card } = await renderCard(
      state({
        preset_mode: "home",
        preset_modes: ["home", "away"],
      }),
    );

    for (const section of ["preset", "schedule", "timer"]) {
      collapseButton(card, section).click();
      await card.updateComplete;
      expect(collapseButton(card, section).getAttribute("aria-expanded")).toBe(
        "false",
      );
      expect(
        card.shadowRoot!.querySelector<HTMLElement>(`#${section}-controls`)!.hidden,
      ).toBe(true);
    }

    card.remove();
    const restored = await renderCard(
      state({
        preset_mode: "home",
        preset_modes: ["home", "away"],
      }),
    );
    for (const section of ["preset", "schedule", "timer"]) {
      expect(collapseButton(restored.card, section).getAttribute("aria-expanded")).toBe(
        "false",
      );
    }

    const otherCard = new ScheduledClimateCard();
    otherCard.setConfig({
      type: "custom:scheduled-climate-card",
      entity: "climate.bedroom_scheduled",
    });
    otherCard.hass = {
      ...restored.card.hass!,
      states: {
        ...restored.card.hass!.states,
        "climate.bedroom_scheduled": {
          ...state(),
          entity_id: "climate.bedroom_scheduled",
        },
      },
    };
    document.body.append(otherCard);
    await otherCard.updateComplete;
    expect(collapseButton(otherCard, "preset").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("lists schedule blocks for the selected day and starts a timer", async () => {
    const { card, callService } = await renderCard();

    expect(card.shadowRoot!.querySelector(".block-list")?.textContent).toContain(
      "07:00 – 09:00",
    );

    button(card, "Turn off later").click();
    await vi.waitFor(() =>
      expect(callService).toHaveBeenCalledWith(
        "scheduled_climate",
        "start_off_timer",
        { entity_id: ENTITY_ID, duration: { seconds: 1800 } },
      ),
    );
  });

  it("writes a full week payload when saving a block", async () => {
    const callWS = vi.fn().mockResolvedValue([schedule()]);
    const { card } = await renderCard(state(), undefined, callWS);

    button(card, "Add block").click();
    await card.updateComplete;

    const times = card.shadowRoot!.querySelectorAll<HTMLInputElement>(
      '.schedule-grid input[type="time"]',
    );
    times[0].value = "18:00";
    times[0].dispatchEvent(new Event("input"));
    times[1].value = "21:00";
    times[1].dispatchEvent(new Event("input"));
    await card.updateComplete;

    button(card, "Save block").click();
    await vi.waitFor(() => expect(callWS).toHaveBeenCalledTimes(2));

    const message = callWS.mock.calls[1][0] as Record<string, unknown>;
    expect(message.type).toBe("schedule/update");
    expect(message.schedule_id).toBe(SCHEDULE_ID);
    expect(message.name).toBe("Living room");
    expect(message.monday).toEqual([
      { from: "07:00:00", to: "09:00:00", data: { temperature: 21 } },
      { from: "18:00:00", to: "21:00:00" },
    ]);
    expect(message.sunday).toEqual([]);
  });

  it("rejects overlapping blocks before writing", async () => {
    const callWS = vi.fn().mockResolvedValue([schedule()]);
    const { card } = await renderCard(state(), undefined, callWS);

    button(card, "Add block").click();
    await card.updateComplete;

    const times = card.shadowRoot!.querySelectorAll<HTMLInputElement>(
      '.schedule-grid input[type="time"]',
    );
    times[0].value = "08:00";
    times[0].dispatchEvent(new Event("input"));
    times[1].value = "10:00";
    times[1].dispatchEvent(new Event("input"));
    await card.updateComplete;

    button(card, "Save block").click();
    await card.updateComplete;

    expect(card.shadowRoot!.querySelector('[role="alert"]')?.textContent).toContain(
      "overlaps",
    );
    expect(callWS).toHaveBeenCalledTimes(1);
  });

  it("offers a read-only schedule to non-administrators", async () => {
    const card = new ScheduledClimateCard();
    card.setConfig({
      type: "custom:scheduled-climate-card",
      entity: ENTITY_ID,
      default_schedule_day: "monday",
    });
    card.hass = {
      states: { [ENTITY_ID]: state() },
      user: { is_admin: false },
      callService: vi.fn(),
      callWS: vi.fn().mockResolvedValue([schedule()]),
    } as unknown as HomeAssistant;
    document.body.append(card);
    await card.updateComplete;
    await card.updateComplete;

    expect(card.shadowRoot!.textContent).toContain(
      "Only administrators can change this schedule.",
    );
    expect(() => button(card, "Add block")).toThrow();
  });

  it("creates and links a schedule from the legacy daily times", async () => {
    const callWS = vi.fn().mockResolvedValue({ id: "new_schedule" });
    const callService = vi.fn().mockResolvedValue(undefined);
    const card = new ScheduledClimateCard();
    card.setConfig({ type: "custom:scheduled-climate-card", entity: ENTITY_ID });
    card.hass = {
      states: {
        [ENTITY_ID]: state({
          schedule_id: null,
          schedule_entity_id: null,
          schedule_enabled: false,
          legacy_schedule: { on_time: "06:30:00", off_time: "22:00:00" },
        }),
      },
      user: { is_admin: true },
      callService,
      callWS,
    } as unknown as HomeAssistant;
    document.body.append(card);
    await card.updateComplete;

    button(card, "Create schedule").click();
    await vi.waitFor(() => expect(callService).toHaveBeenCalled());

    const message = callWS.mock.calls[0][0] as Record<string, unknown>;
    expect(message.type).toBe("schedule/create");
    expect(message.monday).toEqual([{ from: "06:30:00", to: "22:00:00" }]);
    expect(callService).toHaveBeenCalledWith("scheduled_climate", "link_schedule", {
      entity_id: ENTITY_ID,
      schedule_id: "new_schedule",
    });
  });

  it("shows service failures and unavailable state", async () => {
    const errorCall = vi.fn().mockRejectedValue(new Error("Service unavailable"));
    const { card } = await renderCard(state(), errorCall);

    button(card, "off").click();
    await vi.waitFor(() =>
      expect(card.shadowRoot!.querySelector('[role="status"]')?.textContent).toBe(
        "Service unavailable",
      ),
    );

    card.hass = {
      states: { [ENTITY_ID]: { ...state(), state: "unavailable" } },
      user: { is_admin: true },
      callService: errorCall,
      callWS: vi.fn().mockResolvedValue([schedule()]),
    } as unknown as HomeAssistant;
    await card.updateComplete;

    expect(card.shadowRoot!.textContent).toContain("The climate entity is unavailable.");
    expect(card.shadowRoot!.querySelector('[aria-label="Climate controls"]')).toBeNull();
  });
});
