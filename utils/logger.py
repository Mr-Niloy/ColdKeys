

# ===== utils/logger.py =====
"""
Centralized logging utility for ColdKeys
"""

import os
import datetime
from typing import Optional
from evdev import InputDevice, InputEvent

class Logger:
    def __init__(self, log_file: Optional[str] = None):
        self.log_file = log_file or "coldkeys.log"
        self.ensure_log_directory()

    def ensure_log_directory(self):
        """Ensure log directory exists"""
        log_dir = os.path.dirname(self.log_file) if os.path.dirname(self.log_file) else "."
        if log_dir != "." and not os.path.exists(log_dir):
            os.makedirs(log_dir)

    def log(self, message: str) -> None:
        """Log a general message with timestamp"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        # Print to console
        print(f"📝 {log_entry}")
        
        # Write to file
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except Exception as e:
            print(f"Failed to write to log file: {e}")

    def log_event(self, device: InputDevice, event: InputEvent) -> None:
        """Log a specific input event"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        
        # Create detailed event log entry
        log_entry = (
            f"[{timestamp}] EVENT: "
            f"Device='{device.name}' "
            f"Type={event.type} "
            f"Code={event.code} "
            f"Value={event.value} "
            f"Timestamp={event.timestamp()}"
        )
        
        # Write detailed event to file only (to avoid console spam)
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except Exception as e:
            print(f"Failed to write event to log file: {e}")

    def log_error(self, error: str) -> None:
        """Log an error message"""
        self.log(f"ERROR: {error}")

    def log_debug(self, debug_msg: str) -> None:
        """Log a debug message"""
        self.log(f"DEBUG: {debug_msg}")