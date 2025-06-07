# main.py
# from device_manager.linux import list_keyboards, open_device, grab_device, ungrab_device
from device_manager import *
# from input_handler.linux import read_key_events
get_keyboards()
# def main():
#     keyboards = list_keyboards()

#     if not keyboards:
#         print("No keyboards found.")
#         return

#     for i, (name, path) in enumerate(keyboards):
#         print(f"[{i}] {name} - {path}")

#     index = int(input("Select a keyboard by index: "))
#     name, path = keyboards[index]

#     device = open_device(path)
#     if device and grab_device(device):
#         print(f"Reading input from: {name} ({path})")
#         try:
#             read_key_events(device)
#         finally:
#             ungrab_device(device)
#     else:
#         print("Failed to open or grab device.")

# if __name__ == "__main__":
#     main()
    
# This script is the main entry point for the keyboard input handler.