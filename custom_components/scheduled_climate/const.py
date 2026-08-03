"""Constants for Scheduled Climate."""

from homeassistant.components.climate import HVACMode

DOMAIN = "scheduled_climate"
CONF_TARGET_ENTITY_ID = "target_entity_id"
CONF_SCHEDULE_ENABLED = "schedule_enabled"
CONF_ON_TIME = "on_time"
CONF_OFF_TIME = "off_time"
CONF_DEFAULT_HVAC_MODE = "default_hvac_mode"

SERVICE_START_ON_TIMER = "start_on_timer"
SERVICE_START_OFF_TIMER = "start_off_timer"
SERVICE_CANCEL_TIMER = "cancel_timer"
SERVICE_UPDATE_SCHEDULE = "update_schedule"

ATTR_DURATION = "duration"
ATTR_TIMER_ACTION = "timer_action"
ATTR_TIMER_DEADLINE = "timer_deadline"

DEFAULT_SCHEDULE_ENABLED = False
DEFAULT_HVAC_MODE = HVACMode.HEAT

ATTR_SCHEDULE_ENABLED = "schedule_enabled"
ATTR_SCHEDULE_ON_TIME = "schedule_on_time"
ATTR_SCHEDULE_OFF_TIME = "schedule_off_time"
ATTR_NEXT_SCHEDULE_ACTION = "next_schedule_action"
ATTR_NEXT_SCHEDULE_TIME = "next_schedule_time"
ATTR_TEMPERATURE_UNIT = "temperature_unit"
ATTR_TARGET_HUMIDITY_STEP = "target_humidity_step"
ATTR_TARGET_TEMP_STEP = "target_temp_step"
ATTR_MAX_HUMIDITY = "max_humidity"
ATTR_MAX_TEMP = "max_temp"
ATTR_MIN_HUMIDITY = "min_humidity"
ATTR_MIN_TEMP = "min_temp"
