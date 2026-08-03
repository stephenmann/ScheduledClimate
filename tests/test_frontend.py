"""Tests for Scheduled Climate frontend registration."""

from pathlib import Path
from unittest.mock import AsyncMock, Mock

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
from homeassistant.components.http import StaticPathConfig

from custom_components.scheduled_climate.frontend import (
    CARD_PATH,
    CARD_URL,
    FRONTEND_REGISTERED,
    async_register_frontend,
)


async def test_register_frontend_once() -> None:
    """Test the packaged card path and module URL are registered once."""
    url_manager = Mock()
    hass = Mock()
    hass.data = {DATA_EXTRA_MODULE_URL: url_manager}
    hass.http.async_register_static_paths = AsyncMock()

    await async_register_frontend(hass)
    await async_register_frontend(hass)

    hass.http.async_register_static_paths.assert_awaited_once()
    path_config = hass.http.async_register_static_paths.await_args.args[0][0]
    assert isinstance(path_config, StaticPathConfig)
    assert path_config.url_path == CARD_PATH
    assert Path(path_config.path).is_file()
    assert path_config.cache_headers is True
    url_manager.add.assert_called_once_with(CARD_URL)
    assert CARD_URL.startswith(f"{CARD_PATH}?v=")
    assert hass.data[FRONTEND_REGISTERED] is True


async def test_register_frontend_without_loaded_frontend() -> None:
    """Test backend setup can register static assets without frontend loaded."""
    hass = Mock()
    hass.data = {}
    hass.http.async_register_static_paths = AsyncMock()

    await async_register_frontend(hass)

    hass.http.async_register_static_paths.assert_awaited_once()
    assert hass.data[FRONTEND_REGISTERED] is True
