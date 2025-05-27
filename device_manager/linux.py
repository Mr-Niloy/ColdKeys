# device_manager/linux.py
from evdev import InputDevice, list_devices, ecodes
from collections import defaultdict
from utils.logger import get_logger
from utils.led_control import save_led_state, restore_led_state_all


logger = get_logger("device_manager")

def is_keyboard(device):
    """Check if the device is a keyboard based on capabilities."""
    capabilities = device.capabilities()
    if ecodes.EV_KEY in capabilities:
        keys = capabilities[ecodes.EV_KEY]
        # Heuristic: if it has alphabet keys, it's likely a keyboard
        return any(k for k in keys if k in range(ecodes.KEY_A, ecodes.KEY_Z + 1))
    return False

def list_keyboards():
    """List and return all input devices that appear to be keyboards."""
    keyboards = []
    for path in list_devices():
        try:
            device = InputDevice(path)
            if is_keyboard(device):
                logger.info(f"Detected keyboard: {device.name} ({path})")
                keyboards.append((device.name, path))
        except Exception as e:
            logger.warning(f"Could not access device {path}: {e}")
    return keyboards


def list_primary_keyboards():
    keyboards = []
    phys_groups = defaultdict(list)

    for path in list_devices():
        try:
            device = InputDevice(path)
            if is_keyboard(device):
                phys_groups[device.phys].append((device, path))
        except Exception:
            continue

    for group in phys_groups.values():
        # Pick the one with the most keys or just the first
        best = max(group, key=lambda x: len(x[0].capabilities().get(ecodes.EV_KEY, [])))
        keyboards.append((best[0].name, best[1]))

    return keyboards

def open_device(path):
    try:
        device = InputDevice(path)
        logger.info(f"Opened device: {device.name} ({path})")
        return device
    except Exception as e:
        logger.error(f"Failed to open device {path}: {e}")
        return None

def grab_device(device):
    try:
        save_led_state(device)
        device.grab()
        logger.info(f"Grabbed device: {device.name} ({device.path})")
        return True
    except Exception as e:
        logger.error(f"Failed to grab device: {e}")
        return False

def ungrab_device(device):
    try:
        device.ungrab()
        restore_led_state_all()
        logger.info(f"Ungrabbed device: {device.name} ({device.path})")
        return True
    except Exception as e:
        logger.warning(f"Failed to ungrab device: {e}")
        return False
