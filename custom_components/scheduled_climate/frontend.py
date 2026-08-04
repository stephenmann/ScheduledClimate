"""Frontend registration for Scheduled Climate."""

import asyncio
from hashlib import sha256
from pathlib import Path

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL, add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

CARD_PATH = f"/{DOMAIN}/scheduled-climate-card.js"
CARD_FILE = Path(__file__).parent / "frontend" / "scheduled-climate-card.js"
CARD_URL = f"{CARD_PATH}?v={sha256(CARD_FILE.read_bytes()).hexdigest()[:8]}"
FRONTEND_REGISTERED = f"{DOMAIN}_frontend_registered"
FRONTEND_REGISTRATION_LOCK = f"{DOMAIN}_frontend_registration_lock"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Serve and register the Scheduled Climate card once."""
    if hass.data.get(FRONTEND_REGISTERED):
        return

    lock = hass.data.setdefault(FRONTEND_REGISTRATION_LOCK, asyncio.Lock())
    async with lock:
        if hass.data.get(FRONTEND_REGISTERED):
            return

        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_PATH, str(CARD_FILE), cache_headers=True)]
        )
        if DATA_EXTRA_MODULE_URL in hass.data:
            add_extra_js_url(hass, CARD_URL)
        hass.data[FRONTEND_REGISTERED] = True
