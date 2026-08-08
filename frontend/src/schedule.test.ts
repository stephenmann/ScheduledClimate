import { describe, expect, it } from "vitest";
import {
  blocksFromLegacy,
  buildUpdateMessage,
  describeBlock,
  draftToTimeRange,
  emptyDraft,
  timeRangeToDraft,
  todayDay,
  toStorageTime,
  validateDraft,
  withDayBlocks,
} from "./schedule";
import type { ScheduleItem } from "./types";

describe("schedule helpers", () => {
  it("maps a JavaScript day index to a schedule day", () => {
    expect(todayDay(new Date("2026-08-03T12:00:00Z"))).toBe("monday");
    expect(todayDay(new Date("2026-08-09T12:00:00Z"))).toBe("sunday");
  });

  it("stores a midnight end time as the end of the day", () => {
    expect(toStorageTime("00:00", true)).toBe("24:00:00");
    expect(toStorageTime("22:00", true)).toBe("22:00:00");
    expect(toStorageTime("07:30")).toBe("07:30:00");
  });

  it("omits empty block data", () => {
    expect(draftToTimeRange({ ...emptyDraft(), from: "07:00", to: "09:00" })).toEqual({
      from: "07:00:00",
      to: "09:00:00",
    });
  });

  it("keeps only the configured block values", () => {
    const range = draftToTimeRange({
      ...emptyDraft(),
      hvac_mode: "heat",
      temperature: "21.5",
      humidity: "45",
    });

    expect(range.data).toEqual({
      hvac_mode: "heat",
      temperature: 21.5,
      humidity: 45,
    });
  });

  it("round-trips a stored block into a draft", () => {
    const draft = timeRangeToDraft(
      { from: "22:00:00", to: "24:00:00", data: { temperature: 18 } },
      2,
    );

    expect(draft).toMatchObject({
      index: 2,
      from: "22:00",
      to: "00:00",
      temperature: "18",
    });
  });

  it("rejects invalid and overlapping blocks", () => {
    const blocks = [{ from: "07:00:00", to: "09:00:00" }];

    expect(
      validateDraft({ ...emptyDraft(), from: "09:00", to: "08:00" }, blocks),
    ).toContain("after the start time");
    expect(
      validateDraft({ ...emptyDraft(), from: "08:00", to: "10:00" }, blocks),
    ).toContain("overlaps");
    expect(
      validateDraft({ ...emptyDraft(), from: "09:00", to: "10:00" }, blocks),
    ).toBeNull();
  });

  it("rejects a partial temperature range", () => {
    expect(
      validateDraft(
        { ...emptyDraft(), from: "07:00", to: "09:00", target_temp_low: "18" },
        [],
      ),
    ).toContain("low and a high");
  });

  it("rejects mixing a target temperature with a range", () => {
    expect(
      validateDraft(
        {
          ...emptyDraft(),
          from: "07:00",
          to: "09:00",
          temperature: "21",
          target_temp_low: "18",
          target_temp_high: "24",
        },
        [],
      ),
    ).toContain("either");
  });

  it("always sends every day in an update message", () => {
    const schedule: ScheduleItem = {
      id: "living_room",
      name: "Living room",
      friday: [{ from: "09:00:00", to: "10:00:00" }],
    };

    const message = buildUpdateMessage(
      withDayBlocks(schedule, "monday", [
        { from: "09:00:00", to: "10:00:00" },
        { from: "07:00:00", to: "08:00:00" },
      ]),
    );

    expect(message).toMatchObject({
      type: "schedule/update",
      schedule_id: "living_room",
      name: "Living room",
      monday: [
        { from: "07:00:00", to: "08:00:00" },
        { from: "09:00:00", to: "10:00:00" },
      ],
      friday: [{ from: "09:00:00", to: "10:00:00" }],
      tuesday: [],
      sunday: [],
    });
  });

  it("describes a block for the card summary", () => {
    expect(describeBlock({ from: "07:00:00", to: "09:00:00" })).toBe("No changes");
    expect(
      describeBlock({
        from: "07:00:00",
        to: "09:00:00",
        data: { hvac_mode: "heat_cool", temperature: 21 },
      }),
    ).toBe("heat cool · 21°");
  });

  it("converts legacy daily times into one block", () => {
    expect(blocksFromLegacy({ on_time: "06:30:00", off_time: "22:00:00" })).toEqual([
      { from: "06:30:00", to: "22:00:00" },
    ]);
    expect(blocksFromLegacy(null)).toEqual([{ from: "07:00:00", to: "22:00:00" }]);
    expect(blocksFromLegacy({ on_time: "22:00:00", off_time: "06:30:00" })).toEqual([]);
  });
});
