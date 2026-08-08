"""Diagnostics support for Scheduled Climate."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .schedule import ScheduleManager


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    manager: ScheduleManager = hass.data[DOMAIN][entry.entry_id]
    target_state = hass.states.get(manager.target_entity_id)
    schedule_state = manager.schedule_state
    active_block = manager.active_block

    return {
        "entry": {
            "version": entry.version,
            "options": dict(entry.options),
        },
        "schedule": {
            "entity_id": manager.schedule_entity_id,
            "schedule_id": manager.schedule_id,
            "enabled": manager.enabled,
            "off_behavior": manager.off_behavior,
            "apply_on_start": manager.apply_on_start,
            "state": schedule_state.state if schedule_state else None,
            "active_block": active_block.as_dict() if active_block else None,
            "next_event": (
                manager.next_event.isoformat() if manager.next_event else None
            ),
            "issues": list(manager.issues),
        },
        "target": {
            "entity_id": manager.target_entity_id,
            "state": target_state.state if target_state else None,
            "attributes": dict(target_state.attributes) if target_state else None,
        },
    }
