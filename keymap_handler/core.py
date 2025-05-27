# core.py (Key Mapping Handler)
from utils.logger import get_logger

logger = get_logger("keymap_handler")

# These should be set dynamically at runtime based on user selection
PRIMARY_DEVICE_PATH = None
SECONDARY_DEVICE_PATH = None

# You can expand this map
KEYBOARD_KEYMAP = {
    'primary': {},
    'secondary': {},
}

# Predefine a simple G -> G' mapping for demonstration (code 34 = KEY_G)
DEFAULT_MAPPING = {
    34: 'KEY_G',  # G
}

def init_keymaps(primary_path, secondary_path):
    global PRIMARY_DEVICE_PATH, SECONDARY_DEVICE_PATH
    PRIMARY_DEVICE_PATH = primary_path
    SECONDARY_DEVICE_PATH = secondary_path

    # Setup default mappings (copy and extend for secondary)
    KEYBOARD_KEYMAP['primary'] = {code: name for code, name in DEFAULT_MAPPING.items()}
    KEYBOARD_KEYMAP['secondary'] = {code: f"{name}_PRIME" for code, name in DEFAULT_MAPPING.items()}

    logger.info("Key mappings initialized for primary and secondary keyboards")

def resolve_key(code, device_path):
    if device_path == PRIMARY_DEVICE_PATH:
        return KEYBOARD_KEYMAP['primary'].get(code, f"KEY_{code}")
    elif device_path == SECONDARY_DEVICE_PATH:
        return KEYBOARD_KEYMAP['secondary'].get(code, f"KEY_{code}_PRIME")
    else:
        return f"KEY_{code}"