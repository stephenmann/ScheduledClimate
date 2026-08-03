"""Tests for Scheduled Climate one-shot timers."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, Mock, call, patch

from homeassistant.core import HomeAssistant

from custom_components.scheduled_climate.timer import (
    STORAGE_ACTION,
    STORAGE_DEADLINE,
    TimerManager,
)

NOW = datetime(2026, 1, 1, 12, tzinfo=UTC)


def _manager(hass: HomeAssistant) -> tuple[TimerManager, AsyncMock, AsyncMock]:
    """Create a timer manager with mocked action handlers and storage."""
    on_action = AsyncMock()
    off_action = AsyncMock()
    manager = TimerManager(hass, "entry-id", on_action, off_action)
    manager._store = Mock(
        async_load=AsyncMock(return_value=None),
        async_save=AsyncMock(),
        async_remove=AsyncMock(),
    )
    return manager, on_action, off_action


async def test_start_replaces_active_timer(hass: HomeAssistant) -> None:
    """Test starting a timer replaces the existing callback and state."""
    manager, _, _ = _manager(hass)
    first_cancel = Mock()
    second_cancel = Mock()

    with (
        patch(
            "custom_components.scheduled_climate.timer.dt_util.utcnow",
            return_value=NOW,
        ),
        patch(
            "custom_components.scheduled_climate.timer.async_track_point_in_utc_time",
            side_effect=[first_cancel, second_cancel],
        ) as track,
    ):
        await manager.async_start("on", timedelta(minutes=30))
        await manager.async_start("off", timedelta(hours=1))

    first_cancel.assert_called_once_with()
    assert manager.action == "off"
    assert manager.deadline == NOW + timedelta(hours=1)
    assert manager._store.async_save.await_args_list == [
        call(
            {
                STORAGE_ACTION: "on",
                STORAGE_DEADLINE: (NOW + timedelta(minutes=30)).isoformat(),
            }
        ),
        call(
            {
                STORAGE_ACTION: "off",
                STORAGE_DEADLINE: (NOW + timedelta(hours=1)).isoformat(),
            }
        ),
    ]
    assert track.call_count == 2


async def test_timer_fires_once_and_clears_state(hass: HomeAssistant) -> None:
    """Test a timer is cleared before its action executes."""
    manager, on_action, _ = _manager(hass)

    with (
        patch(
            "custom_components.scheduled_climate.timer.dt_util.utcnow",
            return_value=NOW,
        ),
        patch(
            "custom_components.scheduled_climate.timer.async_track_point_in_utc_time",
            return_value=Mock(),
        ) as track,
    ):
        await manager.async_start("on", timedelta(minutes=15))
        fire_callback = track.call_args.args[1]
        await fire_callback(NOW + timedelta(minutes=15))
        await fire_callback(NOW + timedelta(minutes=15))

    assert manager.action is None
    assert manager.deadline is None
    manager._store.async_remove.assert_awaited_once_with()
    on_action.assert_awaited_once_with(NOW + timedelta(minutes=15))


async def test_cancel_clears_timer(hass: HomeAssistant) -> None:
    """Test cancellation removes callback and persisted state."""
    manager, _, _ = _manager(hass)
    cancel_callback = Mock()

    with (
        patch(
            "custom_components.scheduled_climate.timer.dt_util.utcnow",
            return_value=NOW,
        ),
        patch(
            "custom_components.scheduled_climate.timer.async_track_point_in_utc_time",
            return_value=cancel_callback,
        ),
    ):
        await manager.async_start("off", timedelta(minutes=5))
        await manager.async_cancel()

    cancel_callback.assert_called_once_with()
    manager._store.async_remove.assert_awaited_once_with()
    assert manager.action is None
    assert manager.deadline is None


async def test_future_timer_restores_callback(hass: HomeAssistant) -> None:
    """Test a future persisted timer is re-registered on startup."""
    manager, _, _ = _manager(hass)
    deadline = NOW + timedelta(hours=2)
    manager._store.async_load.return_value = {
        STORAGE_ACTION: "off",
        STORAGE_DEADLINE: deadline.isoformat(),
    }

    with (
        patch(
            "custom_components.scheduled_climate.timer.dt_util.utcnow",
            return_value=NOW,
        ),
        patch(
            "custom_components.scheduled_climate.timer.async_track_point_in_utc_time",
            return_value=Mock(),
        ) as track,
    ):
        await manager.async_initialize()

    assert manager.action == "off"
    assert manager.deadline == deadline
    track.assert_called_once_with(hass, manager._async_fire, deadline)


async def test_overdue_timer_executes_once_on_startup(hass: HomeAssistant) -> None:
    """Test an overdue persisted timer is consumed once on startup."""
    manager, on_action, _ = _manager(hass)
    manager._store.async_load.return_value = {
        STORAGE_ACTION: "on",
        STORAGE_DEADLINE: (NOW - timedelta(minutes=1)).isoformat(),
    }

    with (
        patch(
            "custom_components.scheduled_climate.timer.dt_util.utcnow",
            return_value=NOW,
        ),
        patch(
            "custom_components.scheduled_climate.timer.async_track_point_in_utc_time"
        ) as track,
    ):
        await manager.async_initialize()

    track.assert_not_called()
    manager._store.async_remove.assert_awaited_once_with()
    on_action.assert_awaited_once_with(NOW)
    assert manager.action is None
    assert manager.deadline is None


async def test_invalid_duration_is_rejected(hass: HomeAssistant) -> None:
    """Test zero and negative durations are rejected."""
    manager, _, _ = _manager(hass)

    for duration in (timedelta(0), timedelta(seconds=-1)):
        try:
            await manager.async_start("on", duration)
        except ValueError:
            pass
        else:
            raise AssertionError("Expected a non-positive duration to be rejected")
