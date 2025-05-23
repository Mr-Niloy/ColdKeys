# Maps keypresses to actions
# ===== keymap_handler/core.py =====
import json
import logging
from pathlib import Path
from typing import Dict, Optional, Any
import jsonschema

class KeymapHandler:
    def __init__(self, profiles_path: Path):
        self.profiles_path = Path(profiles_path)
        self.profiles_path.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)
        self.current_profile = None
        self.current_keymap = {}
        
        # JSON Schema for profile validation
        self.profile_schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "keymaps": {
                    "type": "object",
                    "patternProperties": {
                        "^KEY_.*": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string", "enum": ["volume", "media", "command", "application", "key_sequence"]},
                                "action": {"type": "string"},
                                "value": {"oneOf": [{"type": "string"}, {"type": "number"}, {"type": "object"}]},
                                "modifiers": {"type": "array", "items": {"type": "string"}},
                                "description": {"type": "string"}
                            },
                            "required": ["type", "action"]
                        }
                    }
                }
            },
            "required": ["name", "keymaps"]
        }
    
    async def load_profile(self, profile_name: str) -> bool:
        """Load a key mapping profile"""
        profile_path = self.profiles_path / f"{profile_name}.json"
        
        if not profile_path.exists():
            # Create default profile if it doesn't exist
            if profile_name == "default":
                await self._create_default_profile()
            else:
                self.logger.error(f"Profile {profile_name} not found")
                return False
        
        try:
            with open(profile_path, 'r') as f:
                profile_data = json.load(f)
            
            # Validate profile
            jsonschema.validate(profile_data, self.profile_schema)
            
            self.current_profile = profile_name
            self.current_keymap = profile_data.get('keymaps', {})
            
            self.logger.info(f"Loaded profile: {profile_data.get('name', profile_name)}")
            self.logger.debug(f"Keymap contains {len(self.current_keymap)} mappings")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load profile {profile_name}: {e}")
            return False
    
    async def map_key_to_action(self, key_event) -> Optional[Dict[str, Any]]:
        """Map a key event to an action"""
        if not key_event.is_pressed():  # Only process key down events
            return None
            
        key_name = key_event.key_name
        
        if key_name not in self.current_keymap:
            self.logger.debug(f"No mapping for key: {key_name}")
            return None
            
        mapping = self.current_keymap[key_name]
        
        # Create action object
        action = {
            'type': mapping['type'],
            'action': mapping['action'],
            'value': mapping.get('value'),
            'key_event': key_event,
            'timestamp': key_event.timestamp
        }
        
        return action
    
    async def _create_default_profile(self):
        """Create a default profile with common mappings"""
        default_profile = {
            "name": "Default Profile",
            "description": "Basic macro keyboard mappings",
            "keymaps": {
                "KEY_F13": {
                    "type": "volume",
                    "action": "mute",
                    "description": "Toggle mute"
                },
                "KEY_F14": {
                    "type": "volume", 
                    "action": "volume_down",
                    "value": 5,
                    "description": "Volume down 5%"
                },
                "KEY_F15": {
                    "type": "volume",
                    "action": "volume_up", 
                    "value": 5,
                    "description": "Volume up 5%"
                },
                "KEY_F16": {
                    "type": "media",
                    "action": "play_pause",
                    "description": "Play/Pause media"
                },
                "KEY_F17": {
                    "type": "media",
                    "action": "next_track",
                    "description": "Next track"
                },
                "KEY_F18": {
                    "type": "media", 
                    "action": "previous_track",
                    "description": "Previous track"
                },
                "KEY_F19": {
                    "type": "application",
                    "action": "launch",
                    "value": "gnome-terminal",
                    "description": "Launch terminal"
                },
                "KEY_F20": {
                    "type": "command",
                    "action": "execute",
                    "value": "xdotool key ctrl+c",
                    "description": "Copy"
                }
            }
        }
        
        profile_path = self.profiles_path / "default.json"
        with open(profile_path, 'w') as f:
            json.dump(default_profile, f, indent=2)
            
        self.logger.info("Created default profile")

# ===== action_performer/linux.py =====
import asyncio
import subprocess
import logging
from typing import Dict, Any, Optional
import shlex

class ActionPerformer:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    async def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an action and return result"""
        action_type = action['type']
        action_name = action['action']
        
        try:
            if action_type == "volume":
                return await self._handle_volume_action(action)
            elif action_type == "media":
                return await self._handle_media_action(action)
            elif action_type == "command":
                return await self._handle_command_action(action)
            elif action_type == "application":
                return await self._handle_application_action(action)
            elif action_type == "key_sequence":
                return await self._handle_key_sequence_action(action)
            else:
                raise ValueError(f"Unknown action type: {action_type}")
                
        except Exception as e:
            self.logger.error(f"Failed to execute action {action_name}: {e}")
            return {"success": False, "error": str(e)}
    
    async def _handle_volume_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Handle volume-related actions"""
        action_name = action['action']
        value = action.get('value', 5)
        
        if action_name == "mute":
            cmd = "amixer -D pulse sset Master toggle"
        elif action_name == "volume_up":
            cmd = f"amixer -D pulse sset Master {value}%+ unmute"
        elif action_name == "volume_down":
            cmd = f"amixer -D pulse sset Master {value}%- unmute"
        else:
            raise ValueError(f"Unknown volume action: {action_name}")
            
        result = await self._run_command(cmd)
        return {"success": result['returncode'] == 0, "output": result['stdout']}
    
    async def _handle_media_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Handle media control actions"""
        action_name = action['action']
        
        # Use playerctl if available, fallback to xdotool
        media_commands = {
            "play_pause": "playerctl play-pause",
            "play": "playerctl play",
            "pause": "playerctl pause", 
            "next_track": "playerctl next",
            "previous_track": "playerctl previous",
            "stop": "playerctl stop"
        }
        
        if action_name in media_commands:
            cmd = media_commands[action_name]
        else:
            # Fallback to xdotool key simulation
            key_map = {
                "play_pause": "XF86AudioPlay",
                "next_track": "XF86AudioNext", 
                "previous_track": "XF86AudioPrev",
                "stop": "XF86AudioStop"
            }
            if action_name in key_map:
                cmd = f"xdotool key {key_map[action_name]}"
            else:
                raise ValueError(f"Unknown media action: {action_name}")
        
        result = await self._run_command(cmd)
        return {"success": result['returncode'] == 0, "output": result['stdout']}
    
    async def _handle_command_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Handle custom command execution"""
        command = action.get('value', '')
        if not command:
            raise ValueError("Command action requires 'value' field")
            
        result = await self._run_command(command)
        return {
            "success": result['returncode'] == 0,
            "output": result['stdout'],
            "error": result['stderr']
        }
    
    async def _handle_application_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Handle application launching"""
        app_command = action.get('value', '')
        if not app_command:
            raise ValueError("Application action requires 'value' field")
        
        # Launch application in background
        result = await self._run_command(f"{app_command} &", shell=True)
        return {"success": True, "message": f"Launched {app_command}"}
    
    async def _handle_key_sequence_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Handle key sequence simulation"""
        sequence = action.get('value', '')
        if not sequence:
            raise ValueError("Key sequence action requires 'value' field")
            
        # Use xdotool to simulate key sequence
        cmd = f"xdotool key {sequence}"
        result = await self._run_command(cmd)
        return {"success": result['returncode'] == 0, "output": result['stdout']}
    
    async def _run_command(self, command: str, shell: bool = False) -> Dict[str, Any]:
        """Run a system command asynchronously"""
        try:
            if shell:
                proc = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            else:
                args = shlex.split(command)
                proc = await asyncio.create_subprocess_exec(
                    *args,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            
            stdout, stderr = await proc.communicate()
            
            return {
                'returncode': proc.returncode,
                'stdout': stdout.decode().strip(),
                'stderr': stderr.decode().strip()
            }
            
        except Exception as e:
            self.logger.error(f"Command execution failed: {e}")
            return {'returncode': -1, 'stdout': '', 'stderr': str(e)}
