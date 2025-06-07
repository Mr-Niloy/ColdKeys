# device_manager/linux.py
from evdev import InputDevice, list_devices, ecodes
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple
from utils.logger import get_logger
from utils.led_control import save_led_state, restore_led_state_all

logger = get_logger("device_manager")

@dataclass
class KeyboardInfo:
    """Information about a detected keyboard device"""
    layout: str
    key_count: int
    has_numpad: bool
    has_function_keys: bool
    has_arrow_keys: bool
    has_media_keys: bool
    has_system_keys: bool
    sub_devices: List[str]
    device_type: str  # "primary", "media", "system", "ghost"

@dataclass
class MouseInfo:
    """Information about a detected mouse device"""
    button_count: int
    detected_buttons: List[str]
    has_scroll_wheel: bool
    has_horizontal_scroll: bool
    has_emulated_keys: bool
    emulated_keys: List[str]
    device_type: str  # "mouse", "keyboard_emulation"

class InputDeviceDetector:
    """Advanced input device detection and categorization"""
    
    # Keyboard layout detection constants
    LAYOUT_SIGNATURES = {
        'full_size': {
            'min_keys': 104,
            'required': ['KEY_KP0', 'KEY_INSERT', 'KEY_F12'],
            'forbidden': []
        },
        'tkl': {
            'min_keys': 87,
            'required': ['KEY_INSERT', 'KEY_HOME', 'KEY_F12'],
            'forbidden': ['KEY_KP0', 'KEY_KP1', 'KEY_KPENTER']
        },
        '75_percent': {
            'min_keys': 70,
            'required': ['KEY_F12', 'KEY_DELETE'],
            'forbidden': ['KEY_KP0', 'KEY_INSERT']
        },
        '65_percent': {
            'min_keys': 60,
            'required': ['KEY_DELETE', 'KEY_UP'],
            'forbidden': ['KEY_F1', 'KEY_F12', 'KEY_KP0']
        },
        '60_percent': {
            'min_keys': 50,
            'required': ['KEY_A', 'KEY_SPACE', 'KEY_LEFTSHIFT'],
            'forbidden': ['KEY_UP', 'KEY_F1', 'KEY_DELETE']
        },
        '40_percent': {
            'min_keys': 30,
            'required': ['KEY_A', 'KEY_SPACE'],
            'forbidden': ['KEY_1', 'KEY_UP', 'KEY_F1']
        },
        'gaming_pad': {
            'min_keys': 10,
            'required': ['KEY_W', 'KEY_A', 'KEY_S', 'KEY_D'],
            'forbidden': []
        }
    }
    
    # Mouse button mapping
    MOUSE_BUTTONS = {
        'BTN_LEFT': 'Left Click',
        'BTN_RIGHT': 'Right Click', 
        'BTN_MIDDLE': 'Middle Click',
        'BTN_SIDE': 'Side Button 1',
        'BTN_EXTRA': 'Side Button 2',
        'BTN_FORWARD': 'Forward',
        'BTN_BACK': 'Back',
        'BTN_TASK': 'Task Button',
        'BTN_0': 'Button 0',
        'BTN_1': 'Button 1',
        'BTN_2': 'Button 2',
        'BTN_3': 'Button 3',
        'BTN_4': 'Button 4',
        'BTN_5': 'Button 5',
        'BTN_6': 'Button 6',
        'BTN_7': 'Button 7',
        'BTN_8': 'Button 8',
        'BTN_9': 'Button 9'
    }
    
    def __init__(self):
        self.devices = {}
        self.keyboards = {}
        self.mice = {}
        self.device_groups = defaultdict(list)
    
    def scan_all_devices(self) -> Dict:
        """Scan all input devices and categorize them"""
        logger.info("Starting comprehensive device scan...")
        
        device_paths = list_devices()
        raw_devices = {}
        
        # First pass: open all devices and get basic info
        for path in device_paths:
            try:
                device = InputDevice(path)
                raw_devices[path] = device
                logger.info(f"Found device: {device.name} ({path})")
            except Exception as e:
                logger.warning(f"Could not open device {path}: {e}")
        
        # Second pass: analyze and categorize devices
        self._group_related_devices(raw_devices)
        self._analyze_keyboards(raw_devices)
        self._analyze_mice(raw_devices)
        
        return {
            'keyboards': self.keyboards,
            'mice': self.mice,
            'device_groups': dict(self.device_groups),
            'raw_devices': raw_devices
        }
    
    def _group_related_devices(self, devices: Dict[str, InputDevice]):
        """Group devices that belong to the same physical device"""
        device_names = defaultdict(list)
        
        for path, device in devices.items():
            # Group by similar names (often same device with multiple interfaces)
            base_name = self._normalize_device_name(device.name)
            device_names[base_name].append((path, device))
        
        for base_name, device_list in device_names.items():
            if len(device_list) > 1:
                self.device_groups[base_name] = device_list
                logger.info(f"Grouped {len(device_list)} devices under '{base_name}'")
    
    def _normalize_device_name(self, name: str) -> str:
        """Normalize device names to group related devices"""
        # Remove common suffixes that indicate sub-devices
        suffixes_to_remove = [
            ' Consumer Control', ' System Control', ' Keyboard',
            ' Mouse', ' Touchpad', ' event', ' kbd', ' consumer'
        ]
        
        normalized = name
        for suffix in suffixes_to_remove:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)]
        
        return normalized.strip()
    
    def _analyze_keyboards(self, devices: Dict[str, InputDevice]):
        """Analyze keyboard devices and detect layouts"""
        for path, device in devices.items():
            if not self._is_keyboard_device(device):
                continue
            
            caps = device.capabilities()
            keyboard_info = self._detect_keyboard_layout(device, caps)
            
            if keyboard_info:
                self.keyboards[path] = keyboard_info
                logger.info(f"Detected keyboard: {device.name} - {keyboard_info.layout} "
                          f"({keyboard_info.key_count} keys, type: {keyboard_info.device_type})")
    
    def _analyze_mice(self, devices: Dict[str, InputDevice]):
        """Analyze mouse devices and detect capabilities"""
        for path, device in devices.items():
            if not self._is_mouse_device(device):
                continue
            
            caps = device.capabilities()
            mouse_info = self._detect_mouse_capabilities(device, caps)
            
            if mouse_info:
                self.mice[path] = mouse_info
                logger.info(f"Detected mouse: {device.name} - {mouse_info.button_count} buttons "
                          f"(type: {mouse_info.device_type})")
    
    def _is_keyboard_device(self, device: InputDevice) -> bool:
        """Check if device is a keyboard or keyboard sub-device"""
        caps = device.capabilities()
        
        # Must have key events
        if ecodes.EV_KEY not in caps:
            return False
        
        keys = caps[ecodes.EV_KEY]
        
        # Check for any keyboard-like keys
        keyboard_indicators = [
            ecodes.KEY_A, ecodes.KEY_SPACE, ecodes.KEY_ENTER,
            ecodes.KEY_VOLUMEUP, ecodes.KEY_PLAY, ecodes.KEY_POWER
        ]
        
        return any(key in keys for key in keyboard_indicators)
    
    def _is_mouse_device(self, device: InputDevice) -> bool:
        """Check if device is a mouse or mouse sub-device"""
        caps = device.capabilities()
        
        # Must have button events or relative movement
        has_buttons = ecodes.EV_KEY in caps and any(
            btn in caps[ecodes.EV_KEY] for btn in [
                ecodes.BTN_LEFT, ecodes.BTN_RIGHT, ecodes.BTN_MIDDLE
            ]
        )
        
        has_movement = ecodes.EV_REL in caps and any(
            rel in caps[ecodes.EV_REL] for rel in [
                ecodes.REL_X, ecodes.REL_Y
            ]
        )
        
        return has_buttons or has_movement
    
    def _detect_keyboard_layout(self, device: InputDevice, caps: Dict) -> Optional[KeyboardInfo]:
        """Detect keyboard layout based on available keys"""
        if ecodes.EV_KEY not in caps:
            return None
        
        keys = set(caps[ecodes.EV_KEY])
        key_count = len(keys)
        
        # Determine device type
        device_type = self._classify_keyboard_device_type(keys)
        
        # Skip ghost devices
        if device_type == "ghost":
            return None
        
        # Detect layout for primary keyboards
        layout = "unknown"
        if device_type == "primary":
            layout = self._classify_keyboard_layout(keys, key_count)
        
        # Analyze key categories
        has_numpad = any(getattr(ecodes, f'KEY_KP{i}', 0) in keys for i in range(10))
        has_function_keys = any(getattr(ecodes, f'KEY_F{i}', 0) in keys for i in range(1, 13))
        has_arrow_keys = all(getattr(ecodes, f'KEY_{arrow}', 0) in keys 
                           for arrow in ['UP', 'DOWN', 'LEFT', 'RIGHT'])
        has_media_keys = any(getattr(ecodes, f'KEY_{media}', 0) in keys 
                           for media in ['VOLUMEUP', 'VOLUMEDOWN', 'PLAY', 'PAUSE'])
        has_system_keys = any(getattr(ecodes, f'KEY_{sys}', 0) in keys 
                            for sys in ['POWER', 'SLEEP', 'BRIGHTNESSUP'])
        
        return KeyboardInfo(
            layout=layout,
            key_count=key_count,
            has_numpad=has_numpad,
            has_function_keys=has_function_keys,
            has_arrow_keys=has_arrow_keys,
            has_media_keys=has_media_keys,
            has_system_keys=has_system_keys,
            sub_devices=[device.path],
            device_type=device_type
        )
    
    def _classify_keyboard_device_type(self, keys: Set[int]) -> str:
        """Classify keyboard device type based on keys"""
        # Check for primary keyboard keys (letters/numbers)
        primary_keys = [getattr(ecodes, f'KEY_{chr(i)}', 0) for i in range(ord('A'), ord('Z')+1)]
        has_primary = any(key in keys for key in primary_keys)
        
        # Check for media keys
        media_keys = [getattr(ecodes, f'KEY_{media}', 0) for media in 
                     ['VOLUMEUP', 'VOLUMEDOWN', 'PLAY', 'PAUSE', 'MUTE']]
        has_media = any(key in keys for key in media_keys if key != 0)
        
        # Check for system keys
        system_keys = [getattr(ecodes, f'KEY_{sys}', 0) for sys in 
                      ['POWER', 'SLEEP', 'BRIGHTNESSUP', 'BRIGHTNESSDOWN']]
        has_system = any(key in keys for key in system_keys if key != 0)
        
        if has_primary:
            return "primary"
        elif has_media:
            return "media"
        elif has_system:
            return "system"
        elif len(keys) < 5:  # Very few keys, likely ghost
            return "ghost"
        else:
            return "unknown"
    
    def _classify_keyboard_layout(self, keys: Set[int], key_count: int) -> str:
        """Classify keyboard layout based on key signatures"""
        for layout_name, signature in self.LAYOUT_SIGNATURES.items():
            if key_count < signature['min_keys']:
                continue
            
            # Check required keys
            required_present = all(
                getattr(ecodes, req_key, 0) in keys 
                for req_key in signature['required']
                if getattr(ecodes, req_key, 0) != 0
            )
            
            # Check forbidden keys
            forbidden_present = any(
                getattr(ecodes, forb_key, 0) in keys 
                for forb_key in signature['forbidden']
                if getattr(ecodes, forb_key, 0) != 0
            )
            
            if required_present and not forbidden_present:
                return layout_name
        
        return "custom"
    
    def _detect_mouse_capabilities(self, device: InputDevice, caps: Dict) -> Optional[MouseInfo]:
        """Detect mouse capabilities and button count"""
        if ecodes.EV_KEY not in caps:
            return None
        
        keys = caps[ecodes.EV_KEY]
        
        # Count mouse buttons
        detected_buttons = []
        button_count = 0
        
        for btn_code, btn_name in self.MOUSE_BUTTONS.items():
            btn_val = getattr(ecodes, btn_code, 0)
            if btn_val != 0 and btn_val in keys:
                detected_buttons.append(btn_name)
                button_count += 1
        
        # Check for scroll capabilities
        has_scroll = False
        has_horizontal_scroll = False
        if ecodes.EV_REL in caps:
            rel_events = caps[ecodes.EV_REL]
            has_scroll = ecodes.REL_WHEEL in rel_events
            has_horizontal_scroll = ecodes.REL_HWHEEL in rel_events
        
        # Check for emulated keyboard keys (gaming mice)
        emulated_keys = []
        has_emulated_keys = False
        keyboard_keys = [getattr(ecodes, f'KEY_{chr(i)}', 0) for i in range(ord('A'), ord('Z')+1)]
        keyboard_keys.extend([ecodes.KEY_LEFTCTRL, ecodes.KEY_LEFTALT, ecodes.KEY_LEFTSHIFT])
        
        for key in keyboard_keys:
            if key != 0 and key in keys:
                emulated_keys.append(f"KEY_{chr(key - ecodes.KEY_A + ord('A'))}" if key >= ecodes.KEY_A and key <= ecodes.KEY_Z else f"KEY_CODE_{key}")
                has_emulated_keys = True
        
        # Determine device type
        has_mouse_buttons = any(getattr(ecodes, btn, 0) in keys for btn in ['BTN_LEFT', 'BTN_RIGHT'])
        device_type = "mouse" if has_mouse_buttons else "keyboard_emulation"
        
        return MouseInfo(
            button_count=button_count,
            detected_buttons=detected_buttons,
            has_scroll_wheel=has_scroll,
            has_horizontal_scroll=has_horizontal_scroll,
            has_emulated_keys=has_emulated_keys,
            emulated_keys=emulated_keys,
            device_type=device_type
        )
    
    def generate_detection_summary(self) -> str:
        """Generate a human-readable summary of detected devices"""
        summary = ["🖥️  INPUT DEVICE DETECTION SUMMARY", "=" * 50]
        
        # Keyboards
        if self.keyboards:
            summary.append("\n⌨️  KEYBOARDS:")
            for path, kb_info in self.keyboards.items():
                device_name = self.devices.get(path, InputDevice(path)).name
                summary.append(f"  📋 {device_name}")
                summary.append(f"     Layout: {kb_info.layout.replace('_', ' ').title()} ({kb_info.key_count} keys)")
                summary.append(f"     Type: {kb_info.device_type.title()}")
                
                features = []
                if kb_info.has_numpad: features.append("Numpad")
                if kb_info.has_function_keys: features.append("F-Keys")
                if kb_info.has_arrow_keys: features.append("Arrows")
                if kb_info.has_media_keys: features.append("Media")
                if kb_info.has_system_keys: features.append("System")
                
                if features:
                    summary.append(f"     Features: {', '.join(features)}")
                summary.append("")
        
        # Mice
        if self.mice:
            summary.append("🖱️  MICE:")
            for path, mouse_info in self.mice.items():
                device_name = self.devices.get(path, InputDevice(path)).name
                summary.append(f"  🖱️  {device_name}")
                summary.append(f"     Buttons: {mouse_info.button_count} detected")
                summary.append(f"     Type: {mouse_info.device_type.replace('_', ' ').title()}")
                
                if mouse_info.detected_buttons:
                    summary.append(f"     Button List: {', '.join(mouse_info.detected_buttons[:5])}")
                
                features = []
                if mouse_info.has_scroll_wheel: features.append("Scroll Wheel")
                if mouse_info.has_horizontal_scroll: features.append("H-Scroll")
                if mouse_info.has_emulated_keys: features.append(f"Macro Keys ({len(mouse_info.emulated_keys)})")
                
                if features:
                    summary.append(f"     Features: {', '.join(features)}")
                
                if mouse_info.button_count >= 5:
                    summary.append("     ⚠️  Extra buttons may be firmware-only")
                summary.append("")
        
        # Device groups
        if self.device_groups:
            summary.append("🔗 DEVICE GROUPS:")
            for group_name, devices in self.device_groups.items():
                summary.append(f"  📦 {group_name} ({len(devices)} sub-devices)")
        
        return "\n".join(summary)

# Keep original functions for backward compatibility
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

# New enhanced functions
def detect_all_input_devices() -> Dict:
    """Main function to detect and categorize all input devices"""
    detector = InputDeviceDetector()
    return detector.scan_all_devices()

def print_device_summary():
    """Print a comprehensive summary of all detected devices"""
    detector = InputDeviceDetector()
    results = detector.scan_all_devices()
    print(detector.generate_detection_summary())

def get_keyboards() -> Dict[str, KeyboardInfo]:
    """Get all detected keyboards with detailed information"""
    detector = InputDeviceDetector()
    detector.scan_all_devices()
    return detector.keyboards

def get_mice() -> Dict[str, MouseInfo]:
    """Get all detected mice with detailed information"""
    detector = InputDeviceDetector()
    detector.scan_all_devices()
    return detector.mice

# Example usage
if __name__ == "__main__":
    print("🔍 Scanning for input devices...")
    print_device_summary()