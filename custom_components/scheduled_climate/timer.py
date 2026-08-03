"""One-shot timers for Scheduled Climate."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Literal, TypedDict

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_utc_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

TimerAction = Literal["on", "off"]
TimerActionHandler = Callable[[datetime], Awaitable[None]]

STORAGE_VERSION = 1
STORAGE_KEY = "scheduled_climate_timer"
STORAGE_ACTION = "action"
STORAGE_DEADLINE = "deadline"


class TimerStorageData(TypedDict):
    """Stored timer state."""

    action: TimerAction
    deadline: str


class TimerManager:
    """Own one persisted timer for a config entry."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry_id: str,
        on_action: TimerActionHandler,
        off_action: TimerActionHandler,
    ) -> None:
        """Initialize the timer manager."""
        self.hass = hass
        self._handlers = {"on": on_action, "off": off_action}
        self._action: TimerAction | None = None
        self._deadline: datetime | None = None
        self._cancel_callback: Callable[[], None] | None = None
        self._listeners: list[Callable[[], None]] = []
        self._store = Store[TimerStorageData](
            hass,
            STORAGE_VERSION,
            f"{STORAGE_KEY}.{entry_id}",
        )

    @property
    def action(self) -> TimerAction | None:
        """Return the active timer action."""
        return self._action

    @property
    def deadline(self) -> datetime | None:
        """Return the active timer deadline in UTC."""
        return self._deadline

    async def async_initialize(self) -> None:
        """Restore and register a persisted timer."""
        stored = await self._store.async_load()
        if not stored:
            return

        action = stored.get(STORAGE_ACTION)
        deadline = dt_util.parse_datetime(stored.get(STORAGE_DEADLINE, ""))
        if action not in self._handlers or deadline is None or deadline.tzinfo is None:
            await self._store.async_remove()
            return

        self._action = action
        self._deadline = deadline.astimezone(UTC)
        if self._deadline <= dt_util.utcnow():
            await self._async_fire(dt_util.utcnow())
        else:
            self._schedule_callback()

    async def async_start(self, action: TimerAction, duration: timedelta) -> None:
        """Start or replace the active timer."""
        if duration.total_seconds() <= 0:
            raise ValueError("Timer duration must be positive")

        self._cancel_scheduled_callback()
        self._action = action
        self._deadline = dt_util.utcnow() + duration
        await self._store.async_save(
            {
                STORAGE_ACTION: action,
                STORAGE_DEADLINE: self._deadline.isoformat(),
            }
        )
        self._schedule_callback()
        self._notify_listeners()

    async def async_cancel(self) -> None:
        """Cancel and clear the active timer."""
        self._cancel_scheduled_callback()
        self._action = None
        self._deadline = None
        await self._store.async_remove()
        self._notify_listeners()

    @callback
    def async_shutdown(self) -> None:
        """Cancel the in-memory callback without clearing persisted state."""
        self._cancel_scheduled_callback()

    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        """Subscribe to timer state changes."""
        self._listeners.append(listener)

        def unsubscribe() -> None:
            self._listeners.remove(listener)

        return unsubscribe

    @callback
    def _schedule_callback(self) -> None:
        """Schedule the active timer callback."""
        if self._deadline is None:
            return
        self._cancel_callback = async_track_point_in_utc_time(
            self.hass,
            self._async_fire,
            self._deadline,
        )

    @callback
    def _cancel_scheduled_callback(self) -> None:
        """Cancel the active in-memory callback."""
        if self._cancel_callback is not None:
            self._cancel_callback()
            self._cancel_callback = None

    async def _async_fire(self, now: datetime) -> None:
        """Consume and execute the active timer once."""
        action = self._action
        if action is None:
            return

        self._cancel_callback = None
        self._action = None
        self._deadline = None
        await self._store.async_remove()
        self._notify_listeners()
        await self._handlers[action](now)

    @callback
    def _notify_listeners(self) -> None:
        """Notify listeners that timer state changed."""
        for listener in self._listeners:
            listener()
