"""Tests for the Scheduled Climate config flow."""

from homeassistant import config_entries
from homeassistant.components.climate import DOMAIN as CLIMATE_DOMAIN
from homeassistant.components.climate import HVACMode
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.scheduled_climate.const import CONF_TARGET_ENTITY_ID, DOMAIN

TARGET_ENTITY_ID = "climate.living_room"


async def test_integration_is_visible_on_integrations_dashboard(
    hass: HomeAssistant,
) -> None:
    """Test the integration is not classified as a hidden helper."""
    integration = await async_get_integration(hass, DOMAIN)

    assert integration.integration_type == "service"


async def _start_user_flow(hass: HomeAssistant) -> config_entries.ConfigFlowResult:
    """Start a user config flow."""
    return await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": config_entries.SOURCE_USER},
    )


async def test_user_flow_creates_entry(hass: HomeAssistant) -> None:
    """Test creating a config entry."""
    hass.states.async_set(TARGET_ENTITY_ID, HVACMode.HEAT)

    result = await _start_user_flow(hass)
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "Living Room",
            CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID,
        },
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Living Room"
    assert result["data"] == {
        CONF_NAME: "Living Room",
        CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID,
    }


async def test_user_flow_rejects_missing_target(hass: HomeAssistant) -> None:
    """Test rejecting a target that does not exist."""
    result = await _start_user_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "Missing",
            CONF_TARGET_ENTITY_ID: "climate.missing",
        },
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {
        CONF_TARGET_ENTITY_ID: "target_not_found",
    }


async def test_user_flow_rejects_scheduled_climate_target(
    hass: HomeAssistant,
) -> None:
    """Test preventing wrappers from targeting other wrappers."""
    registry = er.async_get(hass)
    wrapper = registry.async_get_or_create(CLIMATE_DOMAIN, DOMAIN, "wrapper")
    hass.states.async_set(wrapper.entity_id, HVACMode.HEAT)

    result = await _start_user_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "Nested",
            CONF_TARGET_ENTITY_ID: wrapper.entity_id,
        },
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {
        CONF_TARGET_ENTITY_ID: "target_is_scheduled_climate",
    }


async def test_user_flow_rejects_duplicate_target(hass: HomeAssistant) -> None:
    """Test preventing duplicate target configuration."""
    hass.states.async_set(TARGET_ENTITY_ID, HVACMode.HEAT)
    MockConfigEntry(
        domain=DOMAIN,
        data={CONF_NAME: "Existing", CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
    ).add_to_hass(hass)

    result = await _start_user_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "Duplicate",
            CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID,
        },
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {
        CONF_TARGET_ENTITY_ID: "target_already_configured",
    }


async def test_reconfigure_updates_entry(hass: HomeAssistant) -> None:
    """Test changing the target through reconfiguration."""
    new_target = "climate.bedroom"
    hass.states.async_set(TARGET_ENTITY_ID, HVACMode.HEAT)
    hass.states.async_set(new_target, HVACMode.COOL)
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Living Room",
        data={CONF_NAME: "Living Room", CONF_TARGET_ENTITY_ID: TARGET_ENTITY_ID},
    )
    entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": entry.entry_id,
        },
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            CONF_NAME: "Bedroom",
            CONF_TARGET_ENTITY_ID: new_target,
        },
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert entry.title == "Bedroom"
    assert entry.data[CONF_TARGET_ENTITY_ID] == new_target
