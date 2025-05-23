

# ===== input_handler/linux.py =====
"""
Linux Input Handler
Manages event listening from multiple devices simultaneously
"""

import select
from typing import List, Callable
from evdev import InputDevice, InputEvent, ecodes
from utils.logger import Logger

class InputHandler:
    def __init__(self):
        self.logger = Logger()
        self.running = False

    def listen(self, devices: List[InputDevice], on_event: Callable[[InputDevice, InputEvent], None]) -> None:
        """
        Listen for events from multiple devices simultaneously
        Uses select() to efficiently monitor multiple file descriptors
        """
        if not devices:
            self.logger.log("No devices to listen to")
            return

        self.running = True
        self.logger.log(f"Starting event listener for {len(devices)} devices")
        
        # Create device map for quick lookup
        device_map = {device.fd: device for device in devices}
        
        try:
            while self.running:
                # Use select to wait for events from any device
                ready_fds, _, _ = select.select(device_map.keys(), [], [], 1.0)  # 1 second timeout
                
                for fd in ready_fds:
                    device = device_map[fd]
                    try:
                        # Read all available events from this device
                        for event in device.read():
                            self._process_event(device, event, on_event)
                    except (OSError, IOError) as e:
                        self.logger.log(f"Error reading from device {device.name}: {e}")
                        # Remove the problematic device
                        if fd in device_map:
                            del device_map[fd]
                        if not device_map:
                            self.logger.log("No more devices available")
                            self.running = False
                            break
                        
        except KeyboardInterrupt:
            self.logger.log("Event listener interrupted")
        except Exception as e:
            self.logger.log(f"Unexpected error in event listener: {e}")
        finally:
            self.running = False
            self.logger.log("Event listener stopped")

    def _process_event(self, device: InputDevice, event: InputEvent, callback: Callable) -> None:
        """Process individual events and forward to callback"""
        try:
            # Only process key events (press/release)
            if event.type == ecodes.EV_KEY:
                callback(device, event)
        except Exception as e:
            self.logger.log(f"Error processing event from {device.name}: {e}")

    def stop(self) -> None:
        """Stop the event listener"""
        self.running = False

