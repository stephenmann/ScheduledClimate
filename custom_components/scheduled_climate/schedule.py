"""Daily scheduling for Scheduled Climate."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, date, datetime, time, timedelta, tzinfo
from typing import TypedDict

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    SERVICE_SET_HVAC_MODE,
    HVACMode,
)
from homeassistant.components.climate import (
    DOMAIN as CLIMATE_DOMAIN,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    ATTR_ENTITY_ID,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    CONF_DEFAULT_HVAC_MODE,
    CONF_OFF_TIME,
    CONF_ON_TIME,
    CONF_SCHEDULE_ENABLED,
    CONF_TARGET_ENTITY_ID,
    DEFAULT_HVAC_MODE,
    DEFAULT_SCHEDULE_ENABLED,
)
from .timer import TimerManager

STORAGE_VERSION = 1
STORAGE_KEY = "scheduled_climate"
STORAGE_LAST_ACTIVE_HVAC_MODE = "last_active_hvac_mode"


class ScheduleStorageData(TypedDict, total=False):
    """Stored schedule runtime state."""

    last_active_hvac_mode: str


class ScheduleManager:
    """Own daily schedule callbacks for one config entry."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the schedule manager."""
        self.hass = hass
        self.entry = entry
        self._unsubscribers: list[Callable[[], None]] = []
        self._last_active_hvac_mode: HVACMode | None = None
        self._store = Store[ScheduleStorageData](
            hass,
            STORAGE_VERSION,
            f"{STORAGE_KEY}.{entry.entry_id}",
        )
        self.timer = TimerManager(
            hass,
            entry.entry_id,
            self.async_handle_on,
            self.async_handle_off,
        )

    async def async_initialize(self) -> None:
        """Restore runtime state and register configured callbacks."""
        stored = await self._store.async_load()
        if stored and (mode := stored.get(STORAGE_LAST_ACTIVE_HVAC_MODE)):
            try:
                restored_mode = HVACMode(mode)
            except ValueError:
                restored_mode = None
            if restored_mode is not HVACMode.OFF:
                self._last_active_hvac_mode = restored_mode
        self.async_setup()
        await self.timer.async_initialize()

    @property
    def enabled(self) -> bool:
        """Return whether daily scheduling is enabled."""
        return self.entry.options.get(CONF_SCHEDULE_ENABLED, DEFAULT_SCHEDULE_ENABLED)

    @property
    def on_time(self) -> time | None:
        """Return the configured daily on time."""
        return self._option_time(CONF_ON_TIME)

    @property
    def off_time(self) -> time | None:
        """Return the configured daily off time."""
        return self._option_time(CONF_OFF_TIME)

    @property
    def next_action(self) -> tuple[str, datetime] | None:
        """Return the next configured schedule action and local timestamp."""
        if not self.enabled:
            return None

        now = dt_util.now()
        candidates = [
            (action, self._next_occurrence(now, action_time))
            for action, action_time in (("on", self.on_time), ("off", self.off_time))
            if action_time is not None
        ]
        return min(candidates, key=lambda item: item[1]) if candidates else None

    @callback
    def async_setup(self) -> None:
        """Register configured daily callbacks."""
        self._cancel_schedule_callbacks()
        if not self.enabled:
            return

        if on_time := self.on_time:
            self._unsubscribers.append(
                async_track_time_change(
                    self.hass,
                    self.async_handle_on,
                    hour=on_time.hour,
                    minute=on_time.minute,
                    second=on_time.second,
                )
            )

        if off_time := self.off_time:
            self._unsubscribers.append(
                async_track_time_change(
                    self.hass,
                    self.async_handle_off,
                    hour=off_time.hour,
                    minute=off_time.minute,
                    second=off_time.second,
                )
            )

    @callback
    def async_shutdown(self) -> None:
        """Cancel all registered runtime callbacks."""
        self._cancel_schedule_callbacks()
        self.timer.async_shutdown()

    @callback
    def _cancel_schedule_callbacks(self) -> None:
        """Cancel registered daily schedule callbacks."""
        while self._unsubscribers:
            self._unsubscribers.pop()()

    async def async_handle_on(self, _now: datetime) -> None:
        """Run the daily on action."""
        state = self.hass.states.get(self.entry.data[CONF_TARGET_ENTITY_ID])
        if state is None or state.state in {STATE_UNAVAILABLE, STATE_UNKNOWN}:
            return

        supported_modes = [
            HVACMode(mode) for mode in state.attributes.get(ATTR_HVAC_MODES, [])
        ]
        configured_default = HVACMode(
            self.entry.options.get(CONF_DEFAULT_HVAC_MODE, DEFAULT_HVAC_MODE)
        )
        candidates = (self._last_active_hvac_mode, configured_default)
        mode = next(
            (
                candidate
                for candidate in candidates
                if candidate is not None
                and candidate is not HVACMode.OFF
                and candidate in supported_modes
            ),
            next((item for item in supported_modes if item is not HVACMode.OFF), None),
        )
        if mode is not None:
            await self._async_set_hvac_mode(mode)

    async def async_handle_off(self, _now: datetime) -> None:
        """Run the daily off action."""
        state = self.hass.states.get(self.entry.data[CONF_TARGET_ENTITY_ID])
        if state is None or state.state in {STATE_UNAVAILABLE, STATE_UNKNOWN}:
            return

        try:
            current_mode = HVACMode(state.state)
        except ValueError:
            current_mode = None
        if current_mode is not None and current_mode is not HVACMode.OFF:
            self._last_active_hvac_mode = current_mode
            await self._store.async_save(
                {STORAGE_LAST_ACTIVE_HVAC_MODE: current_mode.value}
            )

        if HVACMode.OFF in [
            HVACMode(mode) for mode in state.attributes.get(ATTR_HVAC_MODES, [])
        ]:
            await self._async_set_hvac_mode(HVACMode.OFF)

    async def _async_set_hvac_mode(self, mode: HVACMode) -> None:
        """Set the target entity HVAC mode."""
        await self.hass.services.async_call(
            CLIMATE_DOMAIN,
            SERVICE_SET_HVAC_MODE,
            {
                ATTR_ENTITY_ID: self.entry.data[CONF_TARGET_ENTITY_ID],
                ATTR_HVAC_MODE: mode,
            },
            blocking=True,
        )

    def _option_time(self, key: str) -> time | None:
        """Parse an optional configured time."""
        value = self.entry.options.get(key)
        return dt_util.parse_time(value) if value else None

    @staticmethod
    def _next_occurrence(now: datetime, action_time: time) -> datetime:
        """Return the next local occurrence of a wall-clock time."""
        if now.tzinfo is None:
            raise ValueError("now must be timezone-aware")

        now_utc = now.astimezone(UTC)
        for day_offset in range(3):
            candidate_date = now.date() + timedelta(days=day_offset)
            candidates = ScheduleManager._valid_occurrences(
                candidate_date, action_time, now.tzinfo
            )
            if future := [
                item for item in candidates if item.astimezone(UTC) > now_utc
            ]:
                return min(future, key=lambda item: item.astimezone(UTC))

        raise RuntimeError("Unable to calculate the next schedule occurrence")

    @staticmethod
    def _valid_occurrences(
        candidate_date: date, action_time: time, timezone: tzinfo
    ) -> list[datetime]:
        """Return valid occurrences, including both sides of a repeated time."""
        occurrences: list[datetime] = []
        seen_utc: set[datetime] = set()
        for fold in (0, 1):
            candidate = datetime.combine(
                candidate_date,
                action_time,
                tzinfo=timezone,
            ).replace(fold=fold)
            candidate_utc = candidate.astimezone(UTC)
            round_trip = candidate_utc.astimezone(timezone)
            if (
                round_trip.date() != candidate_date
                or round_trip.time().replace(tzinfo=None) != action_time
                or candidate_utc in seen_utc
            ):
                continue
            seen_utc.add(candidate_utc)
            occurrences.append(candidate)
        return occurrences
