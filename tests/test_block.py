"""Tests for the schedule block data contract."""

from homeassistant.components.climate import (
    ATTR_FAN_MODE,
    ATTR_FAN_MODES,
    ATTR_HUMIDITY,
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TEMPERATURE,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
    ClimateEntityFeature,
    HVACMode,
)
from homeassistant.const import ATTR_SUPPORTED_FEATURES, STATE_OFF, STATE_ON
from homeassistant.core import State

from custom_components.scheduled_climate.block import ScheduleBlock, build_plan

SCHEDULE_ENTITY_ID = "schedule.living_room"
TARGET_ENTITY_ID = "climate.living_room"

FULL_FEATURES = (
    ClimateEntityFeature.TARGET_TEMPERATURE
    | ClimateEntityFeature.TARGET_TEMPERATURE_RANGE
    | ClimateEntityFeature.FAN_MODE
    | ClimateEntityFeature.TARGET_HUMIDITY
)


def _target(
    state: str = HVACMode.HEAT,
    features: ClimateEntityFeature = FULL_FEATURES,
    **attributes: object,
) -> State:
    """Return a target climate state."""
    return State(
        TARGET_ENTITY_ID,
        state,
        {
            ATTR_HVAC_MODES: [HVACMode.OFF, HVACMode.HEAT, HVACMode.COOL],
            ATTR_FAN_MODES: ["low", "high"],
            ATTR_SUPPORTED_FEATURES: features,
            **attributes,
        },
    )


def test_from_state_returns_none_when_inactive() -> None:
    """Test an inactive schedule has no block."""
    assert ScheduleBlock.from_state(None) is None
    assert ScheduleBlock.from_state(State(SCHEDULE_ENTITY_ID, STATE_OFF)) is None


def test_from_state_parses_known_keys_only() -> None:
    """Test only supported scalar block keys are parsed."""
    block = ScheduleBlock.from_state(
        State(
            SCHEDULE_ENTITY_ID,
            STATE_ON,
            {
                ATTR_HVAC_MODE: HVACMode.HEAT,
                ATTR_TEMPERATURE: 21,
                ATTR_FAN_MODE: "low",
                ATTR_HUMIDITY: 45,
                "next_event": "2024-01-01T00:00:00+00:00",
                "unexpected": "value",
            },
        )
    )

    assert block == ScheduleBlock(
        hvac_mode=HVACMode.HEAT,
        temperature=21.0,
        fan_mode="low",
        humidity=45.0,
    )


def test_from_state_ignores_non_numeric_values() -> None:
    """Test booleans and text are not treated as numbers."""
    block = ScheduleBlock.from_state(
        State(
            SCHEDULE_ENTITY_ID,
            STATE_ON,
            {ATTR_TEMPERATURE: True, ATTR_HUMIDITY: "45"},
        )
    )

    assert block == ScheduleBlock()


def test_plan_orders_mode_before_temperature() -> None:
    """Test the HVAC mode is requested before setpoints."""
    plan = build_plan(
        ScheduleBlock(hvac_mode=HVACMode.HEAT, temperature=21),
        _target(HVACMode.OFF),
    )

    assert [command.service for command in plan.commands] == [
        SERVICE_SET_HVAC_MODE,
        SERVICE_SET_TEMPERATURE,
    ]
    assert plan.issues == ()


def test_plan_skips_mode_when_already_active() -> None:
    """Test no mode command is issued when the mode already matches."""
    plan = build_plan(ScheduleBlock(hvac_mode=HVACMode.HEAT), _target(HVACMode.HEAT))

    assert plan.commands == ()


def test_plan_uses_fallback_mode_when_target_is_off() -> None:
    """Test a block without a mode turns an off target back on."""
    plan = build_plan(
        ScheduleBlock(temperature=21),
        _target(HVACMode.OFF),
        fallback_modes=(HVACMode.COOL,),
    )

    assert plan.commands[0].data[ATTR_HVAC_MODE] == HVACMode.COOL


def test_plan_reports_unsupported_mode() -> None:
    """Test an unsupported HVAC mode is reported."""
    plan = build_plan(ScheduleBlock(hvac_mode=HVACMode.DRY), _target())

    assert plan.commands == ()
    assert plan.issues


def test_plan_reports_unsupported_feature() -> None:
    """Test a setpoint is skipped when the feature is missing."""
    plan = build_plan(
        ScheduleBlock(temperature=21),
        _target(features=ClimateEntityFeature(0)),
    )

    assert plan.commands == ()
    assert plan.issues


def test_plan_reports_out_of_range_temperature() -> None:
    """Test a temperature outside the target range is reported."""
    plan = build_plan(ScheduleBlock(temperature=99), _target())

    assert plan.commands == ()
    assert plan.issues


def test_plan_requires_both_range_values() -> None:
    """Test a partial temperature range is reported."""
    plan = build_plan(ScheduleBlock(target_temp_low=18), _target())

    assert plan.commands == ()
    assert plan.issues


def test_plan_builds_temperature_range() -> None:
    """Test a valid temperature range becomes one command."""
    plan = build_plan(ScheduleBlock(target_temp_low=18, target_temp_high=24), _target())

    assert len(plan.commands) == 1
    assert plan.commands[0].data == {
        ATTR_TARGET_TEMP_LOW: 18.0,
        ATTR_TARGET_TEMP_HIGH: 24.0,
    }


def test_plan_skips_setpoints_when_block_turns_off() -> None:
    """Test a block that turns the target off issues only the mode command."""
    plan = build_plan(ScheduleBlock(hvac_mode=HVACMode.OFF, temperature=21), _target())

    assert [command.service for command in plan.commands] == [SERVICE_SET_HVAC_MODE]
