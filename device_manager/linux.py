# ===== device_manager/linux.py =====
"""
Linux Device Manager
Handles device detection, selection, and exclusive access
"""

import os
from typing import List, Optional
from evdev import InputDevice, list_devices, ecodes
from utils.logger import Logger

class DeviceManager:
    def __init__(self):
        self.logger = Logger()
        self.grabbed_devices = []

    def list_devices(self) -> List[InputDevice]:
        """
        Enumerate all keyboard-capable input devices
        Returns list of InputDevice objects that support keyboard input
        """
        keyboard_devices = []
        
        try:
            device_paths = list_devices()
            self.logger.log(f"Found {len(device_paths)} total input devices")
            
            for path in device_paths:
                try:
                    device = InputDevice(path)
                    
                    # Check if device has keyboard capabilities
                    if self._is_keyboard_device(device):
                        # Check if we can read from it
                        if self._can_access_device(device):
                            keyboard_devices.append(device)
                            self.logger.log(f"Added keyboard device: {device.name} ({path})")
                        else:
                            self.logger.log(f"Cannot access device: {device.name} ({path})")
                    
                except (OSError, IOError) as e:
                    self.logger.log(f"Cannot access device {path}: {e}")
                    continue
                    
        except Exception as e:
            self.logger.log(f"Error listing devices: {e}")
            
        return keyboard_devices

    def _is_keyboard_device(self, device: InputDevice) -> bool:
        """Check if device has keyboard capabilities"""
        capabilities = device.capabilities()
        
        # Must have EV_KEY events
        if ecodes.EV_KEY not in capabilities:
            return False
        
        # Check for common keyboard keys
        keys = capabilities[ecodes.EV_KEY]
        keyboard_keys = [
            ecodes.KEY_A, ecodes.KEY_B, ecodes.KEY_C,
            ecodes.KEY_SPACE, ecodes.KEY_ENTER, ecodes.KEY_ESC
        ]
        
        # If it has at least some keyboard keys, consider it a keyboard
        return any(key in keys for key in keyboard_keys)

    def _can_access_device(self, device: InputDevice) -> bool:
        """Check if we can read from the device"""
        try:
            # Try to read device info
            _ = device.name
            _ = device.path
            return True
        except:
            return False

    def choose_device(self, devices: List[InputDevice], index: int) -> Optional[InputDevice]:
        """Select a device by index"""
        if 0 <= index < len(devices):
            return devices[index]
        return None

    def grab_device(self, device: InputDevice) -> None:
        """
        Take exclusive control of the device
        Prevents the device from sending events to other applications
        """
        try:
            device.grab()
            self.grabbed_devices.append(device)
            self.logger.log(f"Successfully grabbed device: {device.name}")
        except Exception as e:
            self.logger.log(f"Failed to grab device {device.name}: {e}")
            raise

    def release_device(self, device: InputDevice) -> None:
        """Release exclusive control of the device"""
        try:
            device.ungrab()
            if device in self.grabbed_devices:
                self.grabbed_devices.remove(device)
            self.logger.log(f"Released device: {device.name}")
        except Exception as e:
            self.logger.log(f"Failed to release device {device.name}: {e}")

    def release_all_devices(self) -> None:
        """Release all grabbed devices"""
        for device in self.grabbed_devices[:]:  # Copy list to avoid modification during iteration
            self.release_device(device)
