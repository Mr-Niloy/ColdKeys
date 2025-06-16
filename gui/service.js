const AppMeta = {
    appSettings: {
        name : "App Settings",
        desc: "Changes different parameters that are usable across the whole app, including all the pages, editors, and devices",
        lasteChanged: new Date(),
        "hasGUI?" : true,
        GUIType : "popup",
        modList : {
            interfacePreferences : {
                name : "Interface Preferences",
                desc: "Changes GUI behavior",
                list: {
                    "lowCon?" : {
                        name : "Low Contrast GUI",
                        desc: "Reduces colors for all GUI elements",
                        type : "toggle",
                        value : true,
                        defValue : false,
                        "enable?" : true,
                    },
                    "textSize<>" : {
                        name : "Text Size",
                        desc : "Changes text sizes for all GUIs",
                        type : "slider",
                        range : [30, 40],
                        step: 1,
                        defValue : 40,
                        unit: "px",
                        "enable?" : true,
                    },
                    "userTheme#" : {
                        name : "Set Theme",
                        desc : "Changes the color theme for all GUIs",
                        type : "list",
                        options : ['Dark Purple', 'Dark Blue', 'Light AF', 'Dark AF'],
                        value : 0,
                        defValue : 0,
                        "enable?" : true,
                    },
                    "blurUI?" : {
                        name : "Blur UI",
                        desc : "Applies a blur effect to background panels",
                        type : "toggle",
                        value : true,
                        defValue : true,
                        "enable?" : true,
                    },
                }
            },
            otherOptions : {
                name : "Other Options",
                desc: "Application settings that allow changes to core app behavior",
                list: {
                    "AutoStart?" : {
                        name : "Auto Start",
                        desc: "Automatically start the app on boot (minimized)",
                        type : "toggle",
                        value : true,
                        defValue : true,
                        "enable?" : true,
                    },
                    "useLocalHost?" : {
                        name : "Localhost Mode",
                        desc : "Allow access to the app over local networks (e.g., Wi-Fi)",
                        type : "toggle",
                        value : false,
                        defValue : false,
                        "enable?" : true,
                    },
                    "pushInfo?" : {
                        name : "Notifications",
                        desc : "Show tips, errors, and confirmations",
                        type : "toggle",
                        value : false,
                        defValue : false,
                        "enable?" : true,
                    },
                    "maxDevices<>" : {
                        name : "Max Devices",
                        desc : "Limit number of connected devices (0 : unlimited*)",
                        type : "slider",
                        range : [0, 10],
                        step: 1,
                        defValue : 0,
                        "enable?" : true,
                    },
                    "globalScript?" : {
                        name : "Global Scripts",
                        desc : "Enable or disable all scripts globally",
                        type : "toggle",
                        value : true,
                        defValue : true,
                        "enable?" : true,
                    },
                    "globalNodes?" : {
                        name : "Global Nodes",
                        desc : "Enable or disable all node logic globally",
                        type : "toggle",
                        value : true,
                        defValue : true,
                        "enable?" : true,
                    },
                    "confirmClose?" : {
                        name : "Confirm on Exit",
                        desc : "Ask before closing the app to prevent accidental exits",
                        type : "toggle",
                        value : false,
                        defValue : false,
                        "enable?" : true,
                    },
                }
            },
            deviceOptions : {
                name : "Device Options",
                desc: "Changes settings for all connected devices. These can be overridden individually in the 'Device Settings' panel.",
                list: {
                    "ForceReCheck@" : {
                        name : "Refresh List",
                        desc: "Rescans for available devices",
                        type : "button",
                        text : 'Refresh',
                        icon : "fa-solid fa-arrows-rotate",
                        "enable?" : true,
                    },
                    "hotkeysEnabled?" : {
                        name : "Enable Hotkeys",
                        desc : "Toggle all device hotkeys globally",
                        type : "toggle",
                        value : true,
                        defValue : true,
                        "enable?" : true,
                    },
                    "pollRate<>" : {
                        name : "Polling Rate",
                        desc : "Device input check rate (lower = faster)",
                        type : "slider",
                        range : [10, 100],
                        step: 5,
                        defValue : 50,
                        unit: "ms",
                        "enable?" : true,
                    },
                    "defaultProfile#" : {
                        name : "Default Device Profile",
                        desc : "Which device config profile to apply to new devices",
                        type : "list",
                        options : ['Standard', 'Gaming', 'Minimal', 'Custom'],
                        value : 0,
                        defValue : 0,
                        "enable?" : true,
                    },
                }
            },
        },
        onReset: function () {
            // handle default settings (ignore for now)
        }
    },
    updateData : function(){
        this.appSettings
    }
}