# utils/led_control.py

from evdev import ecodes
from utils.logger import get_logger

logger = get_logger("led_control")

LED_CODES = {
    'NUM_LOCK': ecodes.LED_NUML,
    'CAPS_LOCK': ecodes.LED_CAPSL,
    'SCROLL_LOCK': ecodes.LED_SCROLLL,
}

# Store just one global LED state
GLOBAL_LED_STATE = {}

def set_led_state(device, led_name, state):
    code = LED_CODES.get(led_name.upper())
    if code is None:
        raise ValueError(f"Unknown LED: {led_name}")
    try:
        device.set_led(code, int(bool(state)))
        logger.debug(f"{'ON' if state else 'OFF'} {led_name} on {device.name}")
    except Exception as e:
        logger.warning(f"Failed to set {led_name} on {device.name}: {e}")

def save_led_state(device):
    global GLOBAL_LED_STATE
    try:
        cache = {}
        for name, code in LED_CODES.items():
            current = code in device.leds()
            cache[name] = current
        GLOBAL_LED_STATE = cache
        logger.debug(f"Saved global LED state from {device.path}: {cache}")
    except Exception as e:
        logger.warning(f"Could not save LED state from {device.path}: {e}")

def restore_led_state(device):
    if not GLOBAL_LED_STATE:
        logger.debug("No global LED state to restore.")
        return
    try:
        for name, value in GLOBAL_LED_STATE.items():
            set_led_state(device, name, value)
        logger.info(f"Restored global LED state on {device.name}")
    except Exception as e:
        logger.warning(f"Could not restore LEDs on {device.path}: {e}")

def restore_led_state_all():
    """
    Restores LED state for all connected keyboards using GLOBAL_LED_STATE.
    """
    if not GLOBAL_LED_STATE:
        logger.warning("GLOBAL_LED_STATE is empty. Nothing to restore.")
        return

    from device_manager.linux import list_keyboards, open_device
    
    keyboards = list_keyboards()
    for name, path in keyboards:
        try:
            device = open_device(path)
            restore_led_state(device)
        except Exception as e:
            logger.warning(f"Could not restore LED for {name} ({path}): {e}")
