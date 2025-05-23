# ColdKeys Linux Input Core System
# Complete implementation with all modules

# ===== main.py =====
#!/usr/bin/env python3
"""
ColdKeys - Linux Input Core
Entry point for the application
"""

import sys
import signal
from typing import List
from device_manager.linux import DeviceManager
from input_handler.linux import InputHandler
from action_performer.linux import ActionPerformer
from utils.logger import Logger

class ColdKeys:
    def __init__(self):
        self.device_manager = DeviceManager()
        self.input_handler = InputHandler()
        self.action_performer = ActionPerformer()
        self.logger = Logger()
        self.selected_devices = []
        self.running = False

    def setup_signal_handlers(self):
        """Setup graceful shutdown on Ctrl+C"""
        def signal_handler(sig, frame):
            self.logger.log("Received shutdown signal, cleaning up...")
            self.shutdown()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    def display_devices(self, devices):
        """Display available devices to user"""
        print("\n🔍 Available keyboard devices:")
        print("-" * 50)
        for i, device in enumerate(devices):
            print(f"{i + 1}. {device.name}")
            print(f"   Path: {device.path}")
            print(f"   Phys: {device.phys or 'N/A'}")
            print()

    def get_user_selection(self, devices):
        """Get user's device selection"""
        while True:
            try:
                selection = input("Select device numbers (comma-separated, e.g., 1,3): ").strip()
                if not selection:
                    continue
                
                indices = [int(x.strip()) - 1 for x in selection.split(',')]
                selected = []
                
                for idx in indices:
                    if 0 <= idx < len(devices):
                        selected.append(devices[idx])
                    else:
                        print(f"Invalid selection: {idx + 1}")
                        break
                else:
                    return selected
                    
            except ValueError:
                print("Invalid input. Please enter numbers separated by commas.")
            except KeyboardInterrupt:
                print("\nExiting...")
                sys.exit(0)

    def handle_event(self, device, event):
        """Event callback function"""
        # Log the event
        self.logger.log_event(device, event)
        
        # Perform action
        self.action_performer.perform_action(device, event)

    def run(self):
        """Main application loop"""
        self.setup_signal_handlers()
        
        print("🚀 ColdKeys Linux Input Core")
        print("=" * 40)
        
        # Discover devices
        self.logger.log("Discovering input devices...")
        devices = self.device_manager.list_devices()
        
        if not devices:
            print("❌ No keyboard devices found!")
            return
        
        # Display and select devices
        self.display_devices(devices)
        self.selected_devices = self.get_user_selection(devices)
        
        if not self.selected_devices:
            print("❌ No devices selected!")
            return
        
        # Grab devices for exclusive access
        print(f"\n🔒 Taking exclusive control of {len(self.selected_devices)} device(s)...")
        for device in self.selected_devices:
            try:
                self.device_manager.grab_device(device)
                self.logger.log(f"Grabbed device: {device.name}")
                print(f"✅ Grabbed: {device.name}")
            except Exception as e:
                self.logger.log(f"Failed to grab {device.name}: {e}")
                print(f"❌ Failed to grab {device.name}: {e}")
                self.shutdown()
                return
        
        # Start listening
        print(f"\n👂 Listening for events from selected devices...")
        print("Press Ctrl+C to stop\n")
        
        self.running = True
        try:
            self.input_handler.listen(self.selected_devices, self.handle_event)
        except KeyboardInterrupt:
            pass
        finally:
            self.shutdown()

    def shutdown(self):
        """Clean shutdown"""
        if self.running:
            self.running = False
            self.logger.log("Shutting down ColdKeys...")
            
            # Release grabbed devices
            for device in self.selected_devices:
                try:
                    self.device_manager.release_device(device)
                    self.logger.log(f"Released device: {device.name}")
                except:
                    pass
            
            print("👋 ColdKeys shutdown complete")

if __name__ == "__main__":
    app = ColdKeys()
    app.run()


