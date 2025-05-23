# ===== README.md =====
"""
# ColdKeys Linux Input Core

A Linux-based system for capturing and processing input from dedicated keyboards (macroboards).

## Features

- 🔍 **Device Detection**: Automatically discovers all keyboard input devices
- 🔒 **Exclusive Access**: Takes complete control of selected devices (no OS input leakage)  
- 👂 **Multi-Device Listening**: Simultaneously monitors multiple keyboards
- 📝 **Comprehensive Logging**: Logs all events and actions
- 🎯 **Action Framework**: Ready for macro/command execution

## Installation

1. Install Python dependencies:
   ```bash
   pip install evdev
   ```

2. Ensure you have permission to access input devices:
   ```bash
   sudo usermod -a -G input $USER
   # Log out and back in, or use:
   sudo python3 main.py
   ```

## Usage

1. Run the application:
   ```bash
   python3 main.py
   ```

2. Select which keyboard(s) to use as macroboards
3. Press keys on selected devices to see events
4. Press Ctrl+C to exit cleanly

## Architecture

- **device_manager/linux.py**: Device discovery and exclusive access
- **input_handler/linux.py**: Event listening with select() for multiple devices
- **action_performer/linux.py**: Action execution (currently logging)
- **utils/logger.py**: Centralized logging
- **main.py**: Application orchestration

## Next Steps

- Add configuration file support
- Implement actual macro/command execution
- Add hotkey combinations support
- Create GUI for device selection
- Add network/IPC communication for remote actions
"""