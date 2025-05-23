
# ===== action_performer/linux.py =====
"""
Linux Action Performer
Executes actions based on key events with comprehensive utility functions
"""

import os
import subprocess
import webbrowser
import json
from typing import Dict, Any, Optional
from evdev import InputDevice, InputEvent, ecodes
from utils.logger import Logger
import re
from utils.logger import Logger
from typing import List
from evdev import InputDevice, InputEvent, ecodes
import datetime

class ActionPerformer:
    def __init__(self):
        self.logger = Logger()
        self.key_mappings = self._initialize_key_mappings()
        self.action_mappings = self._initialize_action_mappings()

    def _initialize_key_mappings(self) -> dict:
        """Initialize key code to name mappings for common keys"""
        return {
            ecodes.KEY_ESC: "ESC",
            ecodes.KEY_1: "1", ecodes.KEY_2: "2", ecodes.KEY_3: "3",
            ecodes.KEY_4: "4", ecodes.KEY_5: "5", ecodes.KEY_6: "6",
            ecodes.KEY_7: "7", ecodes.KEY_8: "8", ecodes.KEY_9: "9", ecodes.KEY_0: "0",
            ecodes.KEY_Q: "Q", ecodes.KEY_W: "W", ecodes.KEY_E: "E", ecodes.KEY_R: "R",
            ecodes.KEY_T: "T", ecodes.KEY_Y: "Y", ecodes.KEY_U: "U", ecodes.KEY_I: "I",
            ecodes.KEY_O: "O", ecodes.KEY_P: "P",
            ecodes.KEY_A: "A", ecodes.KEY_S: "S", ecodes.KEY_D: "D", ecodes.KEY_F: "F",
            ecodes.KEY_G: "G", ecodes.KEY_H: "H", ecodes.KEY_J: "J", ecodes.KEY_K: "K",
            ecodes.KEY_L: "L",
            ecodes.KEY_Z: "Z", ecodes.KEY_X: "X", ecodes.KEY_C: "C", ecodes.KEY_V: "V",
            ecodes.KEY_B: "B", ecodes.KEY_N: "N", ecodes.KEY_M: "M",
            ecodes.KEY_SPACE: "SPACE",
            ecodes.KEY_ENTER: "ENTER",
            ecodes.KEY_BACKSPACE: "BACKSPACE",
            ecodes.KEY_TAB: "TAB",
            ecodes.KEY_LEFTSHIFT: "L_SHIFT", ecodes.KEY_RIGHTSHIFT: "R_SHIFT",
            ecodes.KEY_LEFTCTRL: "L_CTRL", ecodes.KEY_RIGHTCTRL: "R_CTRL",
            ecodes.KEY_LEFTALT: "L_ALT", ecodes.KEY_RIGHTALT: "R_ALT",
            ecodes.KEY_F1: "F1", ecodes.KEY_F2: "F2", ecodes.KEY_F3: "F3", ecodes.KEY_F4: "F4",
            ecodes.KEY_F5: "F5", ecodes.KEY_F6: "F6", ecodes.KEY_F7: "F7", ecodes.KEY_F8: "F8",
            ecodes.KEY_F9: "F9", ecodes.KEY_F10: "F10", ecodes.KEY_F11: "F11", ecodes.KEY_F12: "F12",
        }

    def _initialize_action_mappings(self) -> Dict[str, Dict[str, Any]]:
        """Initialize default key-to-action mappings"""
        return {
            # Application Shortcuts
            "F1": {"type": "app", "target": "firefox", "description": "Open Firefox"},
            "F2": {"type": "app", "target": "code", "description": "Open VS Code"},
            "F3": {"type": "app", "target": "nautilus", "description": "Open File Manager"},
            "F4": {"type": "app", "target": "gnome-terminal", "description": "Open Terminal"},
            
            # URL Shortcuts
            "1": {"type": "url", "target": "https://github.com", "description": "Open GitHub"},
            "2": {"type": "url", "target": "https://stackoverflow.com", "description": "Open Stack Overflow"},
            "3": {"type": "url", "target": "https://youtube.com", "description": "Open YouTube"},
            
            # Media Controls
            "SPACE": {"type": "media", "target": "play-pause", "description": "Play/Pause Media"},
            "Z": {"type": "media", "target": "previous", "description": "Previous Track"},
            "X": {"type": "media", "target": "next", "description": "Next Track"},
            "C": {"type": "media", "target": "stop", "description": "Stop Media"},
            
            # Volume Controls
            "Q": {"type": "volume", "target": "up", "description": "Volume Up"},
            "A": {"type": "volume", "target": "down", "description": "Volume Down"},
            "S": {"type": "volume", "target": "mute", "description": "Mute/Unmute"},
            
            # System Controls
            "F12": {"type": "system", "target": "screenshot", "description": "Take Screenshot"},
            "F11": {"type": "system", "target": "screen-lock", "description": "Lock Screen"},
            "F10": {"type": "system", "target": "desktop-show", "description": "Show Desktop"},
            
            # Text/Clipboard Actions
            "T": {"type": "text", "target": "timestamp", "description": "Insert Timestamp"},
            "E": {"type": "text", "target": "email", "description": "Insert Email Template"},
            
            # Custom Commands
            "ESC": {"type": "command", "target": "pkill -f spotify", "description": "Kill Spotify"},
        }

    def perform_action(self, device: InputDevice, event: InputEvent) -> None:
        """Perform action based on key event"""
        key_name = self._get_key_name(event.code)
        event_type = self._get_event_type(event.value)
        
        # Only process key presses (not releases or holds)
        if event_type == "PRESS":
            action_msg = f"🎹 {device.name} → {key_name} PRESS"
            print(action_msg)
            self.logger.log(f"KEY_EVENT: {device.name} | {key_name} | PRESS")
            
            # Execute the mapped action
            self._execute_macro(device, key_name, event_type)

    def _execute_macro(self, device: InputDevice, key_name: str, event_type: str) -> None:
        """Execute macro/command for the given key"""
        if key_name in self.action_mappings:
            action = self.action_mappings[key_name]
            action_type = action["type"]
            target = action["target"]
            description = action.get("description", "")
            
            print(f"🚀 Executing: {description}")
            self.logger.log(f"MACRO_EXECUTE: {key_name} → {action_type}:{target}")
            
            try:
                if action_type == "app":
                    self.open_application(target)
                elif action_type == "url":
                    self.open_url(target)
                elif action_type == "media":
                    self.control_media(target)
                elif action_type == "volume":
                    self.control_volume(target)
                elif action_type == "system":
                    self.system_action(target)
                elif action_type == "text":
                    self.insert_text(target)
                elif action_type == "command":
                    self.run_command(target)
                else:
                    self.logger.log(f"Unknown action type: {action_type}")
                    
            except Exception as e:
                error_msg = f"Failed to execute action for {key_name}: {e}"
                print(f"❌ {error_msg}")
                self.logger.log_error(error_msg)
        else:
            self.logger.log(f"No action mapped for key: {key_name}")

    # ===== UTILITY FUNCTIONS =====

    def open_application(self, app_name: str) -> bool:
        """Open an application by name"""
        try:
            # Try to launch the application
            subprocess.Popen([app_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.logger.log(f"Successfully opened application: {app_name}")
            print(f"✅ Opened: {app_name}")
            return True
        except FileNotFoundError:
            # Try common alternatives
            alternatives = {
                "firefox": ["firefox-esr", "firefox-bin"],
                "code": ["code-insiders", "codium", "vscodium"],
                "nautilus": ["thunar", "dolphin", "pcmanfm", "nemo"],
                "gnome-terminal": ["konsole", "xterm", "terminator", "alacritty"]
            }
            
            if app_name in alternatives:
                for alt in alternatives[app_name]:
                    try:
                        subprocess.Popen([alt], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        self.logger.log(f"Successfully opened alternative: {alt}")
                        print(f"✅ Opened: {alt}")
                        return True
                    except FileNotFoundError:
                        continue
            
            self.logger.log_error(f"Application not found: {app_name}")
            print(f"❌ Application not found: {app_name}")
            return False
        except Exception as e:
            self.logger.log_error(f"Failed to open {app_name}: {e}")
            return False

    def open_url(self, url: str) -> bool:
        """Open URL in default browser"""
        try:
            webbrowser.open(url)
            self.logger.log(f"Successfully opened URL: {url}")
            print(f"✅ Opened URL: {url}")
            return True
        except Exception as e:
            self.logger.log_error(f"Failed to open URL {url}: {e}")
            return False

    def control_media(self, action: str) -> bool:
        """Control media playback using playerctl"""
        media_commands = {
            "play-pause": "playerctl play-pause",
            "play": "playerctl play",
            "pause": "playerctl pause",
            "stop": "playerctl stop",
            "next": "playerctl next",
            "previous": "playerctl previous"
        }
        
        if action in media_commands:
            return self.run_command(media_commands[action])
        else:
            self.logger.log_error(f"Unknown media action: {action}")
            return False

    def control_volume(self, action: str) -> bool:
        """Control system volume using pactl/amixer"""
        volume_commands = {
            "up": "pactl set-sink-volume @DEFAULT_SINK@ +5%",
            "down": "pactl set-sink-volume @DEFAULT_SINK@ -5%",
            "mute": "pactl set-sink-mute @DEFAULT_SINK@ toggle"
        }
        
        if action in volume_commands:
            success = self.run_command(volume_commands[action])
            if not success:
                # Fallback to amixer
                amixer_commands = {
                    "up": "amixer -D pulse sset Master 5%+",
                    "down": "amixer -D pulse sset Master 5%-",
                    "mute": "amixer -D pulse sset Master toggle"
                }
                if action in amixer_commands:
                    return self.run_command(amixer_commands[action])
            return success
        else:
            self.logger.log_error(f"Unknown volume action: {action}")
            return False

    def system_action(self, action: str) -> bool:
        """Execute system-level actions"""
        system_commands = {
            "screenshot": "gnome-screenshot -f ~/Pictures/screenshot_$(date +%Y%m%d_%H%M%S).png",
            "screen-lock": "loginctl lock-session",
            "desktop-show": "wmctrl -k on",
            "sleep": "systemctl suspend",
            "logout": "loginctl terminate-user $USER"
        }
        
        if action in system_commands:
            return self.run_command(system_commands[action])
        else:
            self.logger.log_error(f"Unknown system action: {action}")
            return False

    def insert_text(self, text_type: str) -> bool:
        """Insert predefined text using xdotool"""
        text_templates = {
            "timestamp": f"$(date '+%Y-%m-%d %H:%M:%S')",
            "email": "Best regards,\nYour Name\nyour.email@example.com",
            "signature": "---\nGenerated by ColdKeys",
            "lorem": "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        }
        
        if text_type == "timestamp":
            # Special handling for timestamp
            import datetime
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return self.type_text(timestamp)
        elif text_type in text_templates:
            return self.type_text(text_templates[text_type])
        else:
            self.logger.log_error(f"Unknown text type: {text_type}")
            return False

    def type_text(self, text: str) -> bool:
        """Type text using xdotool with proper escaping"""
        try:
            # Escape special characters for shell
            escaped_text = text.replace('\\', '\\\\')  # Escape backslashes first
            escaped_text = escaped_text.replace('"', '\\"')  # Escape quotes
            escaped_text = escaped_text.replace('$', '\\$')  # Escape dollar signs
            escaped_text = escaped_text.replace('`', '\\`')  # Escape backticks
            escaped_text = escaped_text.replace('\n', '\\n')  # Handle newlines
            escaped_text = escaped_text.replace('\t', '\\t')  # Handle tabs
            
            # Use xdotool to type the text
            command = f'xdotool type "{escaped_text}"'
            return self.run_command(command)
        except Exception as e:
            self.logger.log_error(f"Failed to type text: {e}")
            return False

    def type_text_slowly(self, text: str, delay_ms: int = 50) -> bool:
        """Type text with delay between characters (useful for problematic applications)"""
        try:
            escaped_text = self._escape_text_for_shell(text)
            command = f'xdotool type --delay {delay_ms} "{escaped_text}"'
            return self.run_command(command)
        except Exception as e:
            self.logger.log_error(f"Failed to type text slowly: {e}")
            return False

    def paste_from_clipboard(self) -> bool:
        """Simulate Ctrl+V to paste from clipboard"""
        try:
            command = "xdotool key ctrl+v"
            return self.run_command(command)
        except Exception as e:
            self.logger.log_error(f"Failed to paste from clipboard: {e}")
            return False

    def copy_to_clipboard(self, text: str) -> bool:
        """Copy text to clipboard using xclip"""
        try:
            # Use xclip to copy to clipboard
            process = subprocess.Popen(['xclip', '-selection', 'clipboard'], 
                                    stdin=subprocess.PIPE, 
                                    stdout=subprocess.DEVNULL, 
                                    stderr=subprocess.DEVNULL)
            process.communicate(input=text.encode('utf-8'))
            
            if process.returncode == 0:
                self.logger.log(f"Copied to clipboard: {text[:50]}...")
                return True
            else:
                # Fallback to xsel
                return self._copy_to_clipboard_xsel(text)
        except Exception as e:
            self.logger.log_error(f"Failed to copy to clipboard: {e}")
            return self._copy_to_clipboard_xsel(text)

    def _copy_to_clipboard_xsel(self, text: str) -> bool:
        """Fallback clipboard copy using xsel"""
        try:
            process = subprocess.Popen(['xsel', '-b'], 
                                    stdin=subprocess.PIPE, 
                                    stdout=subprocess.DEVNULL, 
                                    stderr=subprocess.DEVNULL)
            process.communicate(input=text.encode('utf-8'))
            return process.returncode == 0
        except:
            return False

    def get_clipboard_content(self) -> Optional[str]:
        """Get current clipboard content"""
        try:
            result = subprocess.run(['xclip', '-selection', 'clipboard', '-o'], 
                                capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return result.stdout
            else:
                # Fallback to xsel
                result = subprocess.run(['xsel', '-b'], 
                                    capture_output=True, text=True, timeout=5)
                return result.stdout if result.returncode == 0 else None
        except Exception as e:
            self.logger.log_error(f"Failed to get clipboard content: {e}")
            return None

    def insert_text_template(self, template_name: str, **kwargs) -> bool:
        """Insert predefined text templates with variable substitution"""
        templates = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.datetime.now().strftime("%H:%M:%S"),
            "email_signature": """Best regards,
    {name}
    {email}
    {phone}""",
            "meeting_template": """Meeting: {subject}
    Date: {date}
    Time: {time}
    Attendees: 
    Agenda:
    - 
    Notes:
    """,
            "bug_report": """## Bug Report

    **Description:**
    {description}

    **Steps to Reproduce:**
    1. 
    2. 
    3. 

    **Expected Behavior:**

    **Actual Behavior:**

    **Environment:**
    - OS: {os}
    - Browser: {browser}
    - Version: {version}
    """,
            "code_comment": """/**
    * {description}
    * @author {author}
    * @date {date}
    * @param {{type}} param - description
    * @return {{type}} description
    */""",
            "lorem_ipsum": """Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."""
        }
        
        if template_name in templates:
            template = templates[template_name]
            
            # Add default values for common variables
            default_kwargs = {
                'name': 'Your Name',
                'email': 'your.email@example.com',
                'phone': '+1-234-567-8900',
                'date': datetime.datetime.now().strftime("%Y-%m-%d"),
                'time': datetime.datetime.now().strftime("%H:%M:%S"),
                'author': 'Your Name',
                'os': 'Linux',
                'browser': 'Firefox',
                'version': '1.0.0',
                'description': 'Description here',
                'subject': 'Meeting Subject'
            }
            
            # Merge provided kwargs with defaults
            merged_kwargs = {**default_kwargs, **kwargs}
            
            try:
                # Format template with variables
                formatted_text = template.format(**merged_kwargs)
                return self.type_text(formatted_text)
            except KeyError as e:
                self.logger.log_error(f"Missing template variable: {e}")
                return False
        else:
            self.logger.log_error(f"Unknown template: {template_name}")
            return False

    def insert_current_selection(self) -> bool:
        """Get currently selected text and perform action on it"""
        try:
            # Copy current selection to clipboard
            subprocess.run(['xdotool', 'key', 'ctrl+c'], timeout=2)
            
            # Wait a moment for clipboard to update
            import time
            time.sleep(0.1)
            
            # Get the selected text
            selected_text = self.get_clipboard_content()
            
            if selected_text:
                self.logger.log(f"Got selected text: {selected_text[:50]}...")
                return True
            return False
        except Exception as e:
            self.logger.log_error(f"Failed to get selected text: {e}")
            return False

    def replace_selected_text(self, new_text: str) -> bool:
        """Replace currently selected text with new text"""
        try:
            # Type the new text (this will replace selected text)
            return self.type_text(new_text)
        except Exception as e:
            self.logger.log_error(f"Failed to replace selected text: {e}")
            return False

    def transform_selected_text(self, transformation: str) -> bool:
        """Transform selected text (uppercase, lowercase, etc.)"""
        try:
            # Get current selection
            if not self.insert_current_selection():
                return False
            
            selected_text = self.get_clipboard_content()
            if not selected_text:
                return False
            
            # Apply transformation
            if transformation == "uppercase":
                transformed = selected_text.upper()
            elif transformation == "lowercase":
                transformed = selected_text.lower()
            elif transformation == "title":
                transformed = selected_text.title()
            elif transformation == "capitalize":
                transformed = selected_text.capitalize()
            elif transformation == "reverse":
                transformed = selected_text[::-1]
            elif transformation == "snake_case":
                transformed = re.sub(r'[^a-zA-Z0-9]+', '_', selected_text).lower().strip('_')
            elif transformation == "camel_case":
                words = re.split(r'[^a-zA-Z0-9]+', selected_text)
                transformed = words[0].lower() + ''.join(word.capitalize() for word in words[1:])
            elif transformation == "kebab-case":
                transformed = re.sub(r'[^a-zA-Z0-9]+', '-', selected_text).lower().strip('-')
            else:
                self.logger.log_error(f"Unknown transformation: {transformation}")
                return False
            
            # Replace with transformed text
            return self.replace_selected_text(transformed)
            
        except Exception as e:
            self.logger.log_error(f"Failed to transform selected text: {e}")
            return False

    def insert_multiline_text(self, lines: List[str]) -> bool:
        """Insert multiple lines of text"""
        try:
            full_text = '\n'.join(lines)
            return self.type_text(full_text)
        except Exception as e:
            self.logger.log_error(f"Failed to insert multiline text: {e}")
            return False

    def insert_formatted_code(self, code: str, language: str = "") -> bool:
        """Insert code with proper formatting (markdown style)"""
        try:
            if language:
                formatted_code = f"```{language}\n{code}\n```"
            else:
                formatted_code = f"```\n{code}\n```"
            return self.type_text(formatted_code)
        except Exception as e:
            self.logger.log_error(f"Failed to insert formatted code: {e}")
            return False

    def clear_current_line(self) -> bool:
        """Clear the current line"""
        try:
            # Select current line and delete
            commands = [
                "xdotool key Home",           # Go to beginning of line
                "xdotool key shift+End",      # Select to end of line
                "xdotool key Delete"          # Delete selected text
            ]
            
            for cmd in commands:
                if not self.run_command(cmd):
                    return False
            return True
        except Exception as e:
            self.logger.log_error(f"Failed to clear current line: {e}")
            return False

    def duplicate_current_line(self) -> bool:
        """Duplicate the current line"""
        try:
            commands = [
                "xdotool key Home",           # Go to beginning of line
                "xdotool key shift+End",      # Select entire line
                "xdotool key ctrl+c",         # Copy line
                "xdotool key End",            # Go to end of line
                "xdotool key Return",         # New line
                "xdotool key ctrl+v"          # Paste duplicated line
            ]
            
            for cmd in commands:
                if not self.run_command(cmd):
                    return False
            return True
        except Exception as e:
            self.logger.log_error(f"Failed to duplicate current line: {e}")
            return False

    def _escape_text_for_shell(self, text: str) -> str:
        """Helper function to escape text for shell commands"""
        # Escape special characters for shell
        escaped_text = text.replace('\\', '\\\\')  # Escape backslashes first
        escaped_text = escaped_text.replace('"', '\\"')  # Escape quotes
        escaped_text = escaped_text.replace('$', '\\$')  # Escape dollar signs
        escaped_text = escaped_text.replace('`', '\\`')  # Escape backticks
        escaped_text = escaped_text.replace('\n', '\\n')  # Handle newlines
        escaped_text = escaped_text.replace('\t', '\\t')  # Handle tabs
        return escaped_text

    # Enhanced action mappings for text functions
    def get_enhanced_text_mappings(self) -> Dict[str, Dict[str, str]]:
        """Get enhanced text-related action mappings"""
        return {
            # Basic text insertion
            "T": {"type": "text_template", "target": "timestamp", "description": "Insert Timestamp"},
            "D": {"type": "text_template", "target": "date", "description": "Insert Date"},
            "E": {"type": "text_template", "target": "email_signature", "description": "Insert Email Signature"},
            
            # Text transformations (require selection first)
            "U": {"type": "text_transform", "target": "uppercase", "description": "Transform to UPPERCASE"},
            "L": {"type": "text_transform", "target": "lowercase", "description": "Transform to lowercase"},
            "SHIFT+T": {"type": "text_transform", "target": "title", "description": "Transform to Title Case"},
            
            # Clipboard operations
            "CTRL+SHIFT+C": {"type": "clipboard", "target": "copy_selection", "description": "Copy Selection"},
            "CTRL+SHIFT+V": {"type": "clipboard", "target": "paste", "description": "Paste from Clipboard"},
            
            # Line operations
            "CTRL+D": {"type": "line_op", "target": "duplicate", "description": "Duplicate Current Line"},
            "CTRL+K": {"type": "line_op", "target": "clear", "description": "Clear Current Line"},
            
            # Code insertion
            "CTRL+SHIFT+P": {"type": "code", "target": "python_template", "description": "Insert Python Code Block"},
            "CTRL+SHIFT+J": {"type": "code", "target": "javascript_template", "description": "Insert JavaScript Code Block"},
        }