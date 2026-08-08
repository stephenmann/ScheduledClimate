"""Config flow for Scheduled Climate."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.components.climate import ATTR_HVAC_MODES, HVACMode
from homeassistant.components.schedule import DOMAIN as SCHEDULE_DOMAIN
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME, Platform
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

from .const import (
    CONF_APPLY_ON_START,
    CONF_DEFAULT_HVAC_MODE,
    CONF_OFF_BEHAVIOR,
    CONF_SCHEDULE_ENABLED,
    CONF_SCHEDULE_ENTITY_ID,
    CONF_TARGET_ENTITY_ID,
    DEFAULT_APPLY_ON_START,
    DEFAULT_HVAC_MODE,
    DEFAULT_OFF_BEHAVIOR,
    DEFAULT_SCHEDULE_ENABLED,
    DOMAIN,
    OFF_BEHAVIORS,
)


def _target_error(
    flow: config_entries.ConfigFlow,
    target_entity_id: str,
    current_entry_id: str | None = None,
) -> str | None:
    """Return a validation error for a target entity, if any."""
    if flow.hass.states.get(target_entity_id) is None:
        return "target_not_found"

    registry_entry = er.async_get(flow.hass).async_get(target_entity_id)
    if registry_entry is not None and registry_entry.platform == DOMAIN:
        return "target_is_scheduled_climate"

    if any(
        entry.entry_id != current_entry_id
        and entry.data.get(CONF_TARGET_ENTITY_ID) == target_entity_id
        for entry in flow._async_current_entries()
    ):
        return "target_already_configured"

    return None


def _data_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    """Return the config flow schema."""
    defaults = defaults or {}
    return vol.Schema(
        {
            vol.Required(
                CONF_NAME, default=defaults.get(CONF_NAME, "Scheduled Climate")
            ): str,
            vol.Required(
                CONF_TARGET_ENTITY_ID,
                default=defaults.get(CONF_TARGET_ENTITY_ID, vol.UNDEFINED),
            ): EntitySelector(EntitySelectorConfig(domain=Platform.CLIMATE)),
        }
    )


class ScheduledClimateConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Scheduled Climate."""

    VERSION = 2

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> ScheduledClimateOptionsFlow:
        """Return the options flow handler."""
        return ScheduledClimateOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial configuration step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            target_entity_id = user_input[CONF_TARGET_ENTITY_ID]
            if error := _target_error(self, target_entity_id):
                errors[CONF_TARGET_ENTITY_ID] = error
            else:
                return self.async_create_entry(
                    title=user_input[CONF_NAME],
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            data_schema=_data_schema(),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Reconfigure the controlled climate entity."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}

        if user_input is not None:
            target_entity_id = user_input[CONF_TARGET_ENTITY_ID]
            if error := _target_error(self, target_entity_id, entry.entry_id):
                errors[CONF_TARGET_ENTITY_ID] = error
            else:
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates=user_input,
                    title=user_input[CONF_NAME],
                )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_data_schema(entry.data),
            errors=errors,
        )


class ScheduledClimateOptionsFlow(config_entries.OptionsFlow):
    """Handle Scheduled Climate options."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Configure the linked schedule helper."""
        errors: dict[str, str] = {}
        if user_input is not None:
            schedule_entity_id = user_input.get(CONF_SCHEDULE_ENTITY_ID)
            if not schedule_entity_id:
                user_input.pop(CONF_SCHEDULE_ENTITY_ID, None)
                if user_input[CONF_SCHEDULE_ENABLED]:
                    errors[CONF_SCHEDULE_ENTITY_ID] = "schedule_entity_required"
            elif self.hass.states.get(schedule_entity_id) is None:
                errors[CONF_SCHEDULE_ENTITY_ID] = "schedule_not_found"
            if not errors:
                return self.async_create_entry(data=user_input)

        options = self.config_entry.options
        target_state = self.hass.states.get(
            self.config_entry.data[CONF_TARGET_ENTITY_ID]
        )
        modes = [
            mode
            for mode in (
                target_state.attributes.get(ATTR_HVAC_MODES, [])
                if target_state is not None
                else []
            )
            if mode != HVACMode.OFF
        ]
        if not modes:
            modes = [mode for mode in HVACMode if mode is not HVACMode.OFF]

        schema: dict[vol.Marker, Any] = {
            vol.Optional(
                CONF_SCHEDULE_ENTITY_ID,
                default=options.get(CONF_SCHEDULE_ENTITY_ID, vol.UNDEFINED),
            ): EntitySelector(EntitySelectorConfig(domain=SCHEDULE_DOMAIN)),
            vol.Required(
                CONF_SCHEDULE_ENABLED,
                default=options.get(CONF_SCHEDULE_ENABLED, DEFAULT_SCHEDULE_ENABLED),
            ): BooleanSelector(),
            vol.Required(
                CONF_DEFAULT_HVAC_MODE,
                default=options.get(CONF_DEFAULT_HVAC_MODE, DEFAULT_HVAC_MODE),
            ): SelectSelector(
                SelectSelectorConfig(
                    options=modes,
                    mode=SelectSelectorMode.DROPDOWN,
                    translation_key="hvac_mode",
                )
            ),
            vol.Required(
                CONF_OFF_BEHAVIOR,
                default=options.get(CONF_OFF_BEHAVIOR, DEFAULT_OFF_BEHAVIOR),
            ): SelectSelector(
                SelectSelectorConfig(
                    options=list(OFF_BEHAVIORS),
                    mode=SelectSelectorMode.DROPDOWN,
                    translation_key="off_behavior",
                )
            ),
            vol.Required(
                CONF_APPLY_ON_START,
                default=options.get(CONF_APPLY_ON_START, DEFAULT_APPLY_ON_START),
            ): BooleanSelector(),
        }
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(schema),
            errors=errors,
        )
