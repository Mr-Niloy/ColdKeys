# input_handler/linux.py
from evdev import ecodes
from utils.logger import get_logger
from action_performer.linux import simulate_key

logger = get_logger("input_handler")

# Define a placeholder for mapped keys
# In real case, fetch this from user config or keymap handler
CUSTOM_MAPPED_KEYS = {
    ecodes.KEY_F1,  # These won't be passed to OS
    ecodes.KEY_F2,
    ecodes.KEY_LEFTMETA,  # Example of custom mapped keys

}

def read_key_events(device, simulate_unmapped=True):
    logger.info(f"Started reading events from {device.name} ({device.path})")

    try:
        for event in device.read_loop():  # This blocks until an event is available
            if event.type == ecodes.EV_KEY:
                key_code = event.code
                key_value = event.value
                key_timestamp = event.timestamp()

                key_state = {0: "KEY_UP", 1: "KEY_DOWN", 2: "KEY_HOLD"}.get(key_value, "UNKNOWN")
                key_name = ecodes.KEY.get(key_code, f"KEY_{key_code}")

                logger.info(f"{key_state}: {key_name} ({key_code}) at {key_timestamp:.4f}")

                # Only simulate if device is grabbed and key is unmapped
                # if simulate_unmapped and key_code not in CUSTOM_MAPPED_KEYS:
                    # simulate_key(key_code, key_value)

    except KeyboardInterrupt:
        logger.info("Stopped input reading | KeyboardInterrupt received. Exiting.")
    except Exception as e:
        logger.error(f"Error reading events: {e}")
