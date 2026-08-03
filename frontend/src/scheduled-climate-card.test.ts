import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduledClimateCard } from "./scheduled-climate-card";
import type { HassEntity, HomeAssistant } from "./types";

const ENTITY_ID = "climate.living_room_scheduled";

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
      hvac_modes: ["off", "heat_cool"],
      swing_horizontal_mode: "off",
      swing_horizontal_modes: ["off", "on"],
      schedule_enabled: true,
      schedule_on_time: "06:30:00",
      schedule_off_time: "22:00:00",
      timer_action: null,
      timer_deadline: null,
      ...attributes,
    },
  };
}

async function renderCard(
  entityState = state(),
  callService = vi.fn().mockResolvedValue(undefined),
): Promise<{ card: ScheduledClimateCard; callService: ReturnType<typeof vi.fn> }> {
  const card = new ScheduledClimateCard();
  card.setConfig({
    type: "custom:scheduled-climate-card",
    entity: ENTITY_ID,
    timer_presets: [15, 30],
  });
  card.hass = {
    states: { [ENTITY_ID]: entityState },
    callService,
  } as HomeAssistant;
  document.body.append(card);
  await card.updateComplete;
  return { card, callService };
}

function button(card: ScheduledClimateCard, label: string): HTMLButtonElement {
  const match = [...card.shadowRoot!.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!match) throw new Error(`Button not found: ${label}`);
  return match;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("scheduled-climate-card", () => {
  it("renders supported range and horizontal swing controls", async () => {
    const { card, callService } = await renderCard();
    const range = card.shadowRoot!.querySelector<HTMLElement>(".range-target")!;
    const inputs = range.querySelectorAll<HTMLInputElement>('input[type="number"]');
    const horizontalSwing = [...card.shadowRoot!.querySelectorAll("label")].find(
      (label) => label.textContent?.includes("Horizontal swing"),
    )!.querySelector("select")!;

    expect(inputs).toHaveLength(2);
    expect(horizontalSwing.value).toBe("off");

    inputs[0].value = "18.5";
    inputs[0].dispatchEvent(new Event("change"));
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

  it("dispatches schedule and timer services", async () => {
    const { card, callService } = await renderCard();

    button(card, "Save").click();
    await vi.waitFor(() =>
      expect(callService).toHaveBeenCalledWith(
        "scheduled_climate",
        "update_schedule",
        {
          entity_id: ENTITY_ID,
          schedule_enabled: true,
          on_time: "06:30",
          off_time: "22:00",
        },
      ),
    );
    await vi.waitFor(() => expect(button(card, "Save").disabled).toBe(false));

    button(card, "Turn off later").click();
    await vi.waitFor(() =>
      expect(callService).toHaveBeenCalledWith(
        "scheduled_climate",
        "start_off_timer",
        { entity_id: ENTITY_ID, duration: { seconds: 1800 } },
      ),
    );
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
      callService: errorCall,
    } as HomeAssistant;
    await card.updateComplete;

    expect(card.shadowRoot!.textContent).toContain("The climate entity is unavailable.");
    expect(card.shadowRoot!.querySelector('[aria-label="Climate controls"]')).toBeNull();
  });
});
