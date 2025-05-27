# action_performer/linux.py
from evdev import UInput, ecodes
from utils.logger import get_logger

logger = get_logger("action_performer")

# Create virtual input device once
ui = UInput()

def simulate_key(code, value):
    """
    Simulates a key event using UInput.
    value: 1 = down, 0 = up, 2 = hold
    """
    try:
        ui.write(ecodes.EV_KEY, code, value)
        ui.syn()
        state = {0: "KEY_UP", 1: "KEY_DOWN", 2: "KEY_HOLD"}.get(value, f"UNKNOWN({value})")
        logger.info(f"Simulated {state} for key code {code}")
    except Exception as e:
        logger.error(f"Failed to simulate key event: {e}")
