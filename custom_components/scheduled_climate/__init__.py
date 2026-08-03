"""Scheduled Climate integration."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .frontend import async_register_frontend
from .schedule import ScheduleManager

PLATFORMS = (Platform.CLIMATE,)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Scheduled Climate from a config entry."""
    await async_register_frontend(hass)
    manager = ScheduleManager(hass, entry)
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = manager
    await manager.async_initialize()
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Scheduled Climate config entry."""
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False

    manager: ScheduleManager = hass.data[DOMAIN].pop(entry.entry_id)
    manager.async_shutdown()
    return True


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload Scheduled Climate after options change."""
    await hass.config_entries.async_reload(entry.entry_id)
