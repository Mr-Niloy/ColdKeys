// Global variables
let currentProfile = "default";
let keyboardDevices = [];
let selectedKeyboard = null;
let shortcuts = [];
let listeningForKey = false;
let currentKey = null;
let isDarkTheme = true;

// DOM elements
const deviceSelector = document.getElementById("device-selector");
const profileDropdown = document.getElementById("profile-dropdown");
const deviceStatus = document.querySelector(".device-status");
const shortcutsContainer = document.querySelector(".shortcuts-container");
const emptyState = document.querySelector(".empty-state");
const addShortcutButton = document.getElementById("add-shortcut");
const keyListenModal = document.getElementById("key-listen-modal");
const assignActionModal = document.getElementById("assign-action-modal");
const saveProfileButton = document.getElementById("save-profile");
const themeToggle = document.getElementById("theme-toggle");
const actionTypeSelect = document.getElementById("action-type");
const dynamicFormContainer = document.querySelector(".dynamic-form-container");
const navLinks = document.querySelectorAll(".nav-links a");
const viewActionsPanel = document.getElementById("view-actions-panel");
const assignMacrosPanel = document.getElementById("assign-macros-panel");
const filterButtons = document.querySelectorAll(".filter-button");
const actionCards = document.querySelectorAll(".action-card");
const globalSettingsPanel = document.getElementById("global-settings-panel");
const holdDurationSlider = document.getElementById("key-hold-duration");
const holdDurationValue = document.getElementById("hold-duration-value");
const repeatRateSlider = document.getElementById("repeat-rate");
const repeatRateValue = document.getElementById("repeat-rate-value");
const debounceSlider = document.getElementById("key-debounce");
const debounceValue = document.getElementById("debounce-value");
const resetSettingsBtn = document.getElementById("reset-settings");
const saveSettingsBtn = document.getElementById("save-settings");
const svgObject = document.getElementById("keyboard-svg");
svgObject.addEventListener("load", () => {
  const svgDoc = svgObject.contentDocument;
  injectSvgCss(svgDoc);
});
function injectSvgCss(svgDoc) {
  const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    .highlighted-key rect {
      fill: #00eaff !important;
      stroke: #007a99 !important;
      stroke-width: 2;
    }
  `;
  svgDoc.querySelector("svg").appendChild(style);
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Device selection
  deviceSelector.addEventListener("change", handleDeviceChange);

  // Profile selection
  profileDropdown.addEventListener("change", handleProfileChange);

  // Add shortcut button
  addShortcutButton.addEventListener("click", openKeyListenModal);

  // Key listen modal
  document
    .querySelector(".cancel-listen")
    .addEventListener("click", closeKeyListenModal);
  document
    .querySelector(".confirm-key")
    .addEventListener("click", openAssignActionModal);
  document.querySelectorAll(".close-button").forEach((button) => {
    button.addEventListener("click", closeAllModals);
  });

  // Assign action modal
  actionTypeSelect.addEventListener("change", updateDynamicForm);
  document
    .querySelector(".cancel-action")
    .addEventListener("click", closeAssignActionModal);
  document.querySelector(".save-action").addEventListener("click", saveAction);

  // Save profile button
  saveProfileButton.addEventListener("click", saveProfile);

  // Navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveNavLink(link);
    });
  });

  // Setup key detection (simulated)
  document.addEventListener("keydown", (e) => {
    if (listeningForKey) {
      handleKeyDetection(e);
    }
  });
}

// Toggle between light and dark theme
function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  updateTheme();
}

// Update the theme based on current settings
function updateTheme() {
  const body = document.body;
  const themeIcon = document.querySelector("#theme-toggle i");

  if (isDarkTheme) {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    themeIcon.className = "fas fa-moon";
  } else {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    themeIcon.className = "fas fa-sun";
  }
}

// Set active navigation link
function setActiveNavLink(activeLink) {
  navLinks.forEach((link) => {
    link.classList.remove("active");
  });
  activeLink.classList.add("active");

  // Handle mode switching logic here
  const mode = activeLink.getAttribute("data-mode");
  console.log(`Switched to ${mode} mode`);
}

// Fetch available keyboard devices (simulated)
function fetchDevices() {
  // Simulate API call to backend
  setTimeout(() => {
    keyboardDevices = [
      { id: "keyboard1", name: "Logitech G Pro" },
      { id: "keyboard2", name: "Razer BlackWidow" },
      { id: "keyboard3", name: "Generic USB Keyboard" },
    ];

    // Update device selector
    updateDeviceSelector();
  }, 1000);
}

// Update device selector dropdown with available devices
function updateDeviceSelector() {
  // Clear loading option
  deviceSelector.innerHTML = "";

  // Add placeholder
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select a keyboard";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  deviceSelector.appendChild(placeholderOption);

  // Add devices
  keyboardDevices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.id;
    option.textContent = device.name;
    deviceSelector.appendChild(option);
  });
  renderShortcuts();
}

// Handle device selection change
function handleDeviceChange(e) {
  const deviceId = e.target.value;
  selectedKeyboard = keyboardDevices.find((device) => device.id === deviceId);

  if (selectedKeyboard) {
    // Update status
    const statusDot = document.querySelector(".status-dot");
    const statusText = document.querySelector(".status-text");

    statusDot.classList.remove("disconnected");
    statusDot.classList.add("connected");
    statusText.textContent = "Connected";

    console.log(`Selected keyboard: ${selectedKeyboard.name}`);
  }
}

// Handle profile selection change
function handleProfileChange(e) {
  const newProfile = e.target.value;

  if (newProfile === "custom") {
    // Handle creating new profile
    const profileName = prompt("Enter new profile name:");
    if (profileName) {
      // Create new profile option
      const option = document.createElement("option");
      option.value = profileName.toLowerCase().replace(/\s+/g, "-");
      option.textContent = profileName;

      // Insert before custom option
      profileDropdown.insertBefore(option, profileDropdown.lastChild);

      // Select new option
      profileDropdown.value = option.value;
      currentProfile = option.value;
    } else {
      // Revert to previous selection
      profileDropdown.value = currentProfile;
    }
  } else {
    currentProfile = newProfile;
    loadProfile(currentProfile);
  }
}

// Load profile from server (simulated)
function loadProfile(profileName) {
  // Simulate API call to get profile data
  console.log(`Loading profile: ${profileName}`);

  // Clear current shortcuts
  shortcuts = [];

  // For demo, add some sample shortcuts if profile is default
  if (profileName === "default") {
    shortcuts = [
      {
        id: "shortcut1",
        key: "G",
        modifiers: [],
        deviceId: "keyboard1",
        status: true,
        actionType: "launch",
        action: { path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe" },
      },
      {
        id: "shortcut2",
        key: "M",
        modifiers: ["Ctrl", "Alt"],
        deviceId: "keyboard1",
        actionType: "volume",
        action: { command: "mute" },
      },
      {
        id: "shortcut3",
        key: "ArrowUp",
        modifiers: ["Shift"],
        deviceId: "keyboard2",
        status: true,
        actionType: "media",
        action: { command: "play_pause" },
      },
    ];
  } else if (profileName === "gaming") {
    shortcuts = [
      {
        id: "game1",
        key: "F",
        modifiers: [],
        deviceId: "keyboard1",
        status: false,
        actionType: "hotkey",
        action: { keys: "Ctrl+F" },
      },
      {
        id: "game2",
        key: "V",
        modifiers: [],
        deviceId: "keyboard1",
        status: true,
        actionType: "launch",
        action: { path: "C:\\Program Files\\Steam\\steam.exe" },
      },
    ];
  } else if (profileName === "productivity") {
    shortcuts = [
      {
        id: "prod1",
        key: "C",
        modifiers: [],
        deviceId: "keyboard1",
        status: true,
        actionType: "launch",
        action: {
          path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE",
        },
      },
      {
        id: "prod2",
        key: "W",
        modifiers: [],
        deviceId: "keyboard1",
        status: false,
        actionType: "launch",
        action: {
          path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
        },
      },
    ];
  }

  // Update UI
  renderShortcuts();
}

// Render shortcuts in the UI
function renderShortcuts() {
  const shortcutsContainer = document.querySelector(".shortcuts-container");
  const emptyState = shortcutsContainer.querySelector(".empty-state");

  // Remove all rows except the empty state row
  shortcutsContainer
    .querySelectorAll("tr.shortcut-item")
    .forEach((row) => row.remove());

  if (shortcuts.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");

    shortcuts.forEach((shortcut) => {
      const row = createShortcutElement(shortcut);
      shortcutsContainer.appendChild(row);
    });
  }
}

// Create a shortcut list item element
function createShortcutElement(shortcut) {
  const row = document.createElement("tr");
  row.className = "shortcut-item";
  row.dataset.id = shortcut.id;

  // === Key Combination ===
  const keyCell = document.createElement("td");
  const keyCombo = document.createElement("div");
  keyCombo.className = "key-combo";

  shortcut.modifiers.forEach((mod) => {
    const modBadge = document.createElement("span");
    modBadge.className = "key-badge";
    modBadge.textContent = mod;
    keyCombo.appendChild(modBadge);

    const plus = document.createElement("span");
    plus.textContent = "+";
    keyCombo.appendChild(plus);
  });

  const keyBadge = document.createElement("span");
  keyBadge.className = "key-badge";
  keyBadge.textContent = shortcut.key;
  keyCombo.appendChild(keyBadge);
  keyCell.appendChild(keyCombo);

  // === Action ===
  const actionCell = document.createElement("td");
  const actionDesc = document.createElement("div");
  actionDesc.className = "action-description";

  const actionIcon = document.createElement("i");
  actionIcon.className = "action-icon fas";

  switch (shortcut.actionType) {
    case "launch":
      actionIcon.classList.add("fa-rocket");
      actionDesc.innerHTML += `Launch: <strong>${getFileNameFromPath(
        shortcut.action.path
      )}</strong>`;
      break;
    case "hotkey":
      actionIcon.classList.add("fa-keyboard");
      actionDesc.innerHTML += `Hotkey: <strong>${shortcut.action.keys}</strong>`;
      break;
    case "volume":
      actionIcon.classList.add("fa-volume-up");
      actionDesc.innerHTML += `Volume: <strong>${shortcut.action.command}</strong>`;
      break;
    case "media":
      actionIcon.classList.add("fa-music");
      actionDesc.innerHTML += `Media: <strong>${formatCommand(
        shortcut.action.command
      )}</strong>`;
      break;
    case "script":
      actionIcon.classList.add("fa-code");
      actionDesc.innerHTML += `Script: <strong>${getFileNameFromPath(
        shortcut.action.path
      )}</strong>`;
      break;
  }
  actionDesc.prepend(actionIcon);
  actionCell.appendChild(actionDesc);
  console.log(shortcut);

  // === Device (optional, placeholder) ===
  const deviceCell = document.createElement("td");
  deviceCell.textContent = getDeviceNameById(shortcut.deviceId);

  // === Controls ===
  const controlCell = document.createElement("td");
  const controls = document.createElement("div");
  controls.className = "item-controls";

  const editButton = document.createElement("button");
  editButton.className = "control-button edit";
  editButton.innerHTML = '<i class="fas fa-edit"></i>';
  editButton.onclick = () => editShortcut(shortcut.id);

  const deleteButton = document.createElement("button");
  deleteButton.className = "control-button delete";
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.onclick = () => deleteShortcut(shortcut.id);

  controls.appendChild(editButton);
  controls.appendChild(deleteButton);
  controlCell.appendChild(controls);

  // === Status Toggle ===
  const statusCell = document.createElement("td");
  const toggleWrapper = document.createElement("div");
  toggleWrapper.className = "setting-control";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = shortcut.status !== false;
  checkbox.addEventListener("change", () => {
    shortcut.status = checkbox.checked;
    // Optional: persist the status change or trigger any effect
  });

  const slider = document.createElement("span");
  slider.className = "toggle-slider";

  toggleLabel.appendChild(checkbox);
  toggleLabel.appendChild(slider);
  toggleWrapper.appendChild(toggleLabel);
  statusCell.appendChild(toggleWrapper);

  // Append all cells to the row
  row.appendChild(keyCell);
  row.appendChild(actionCell);
  row.appendChild(deviceCell);
  row.appendChild(controlCell);
  row.appendChild(statusCell); // ✅ NEW

  return row;
}

// Get device name by ID
function getDeviceNameById(deviceId) {
  console.log(deviceId);

  const device = keyboardDevices.find((dev) => dev.id === deviceId);
  return device ? device.name : "—";
}

// Helper function to extract filename from path
function getFileNameFromPath(path) {
  if (!path) return "Unknown";
  return path.split("\\").pop();
}

// Helper function to format command names
function formatCommand(command) {
  return command.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Open key listen modal
function openKeyListenModal() {
  if (!selectedKeyboard) {
    alert("Please select a keyboard first!");
    return;
  }

  listeningForKey = true;
  currentKey = null;

  // Reset UI
  const keyBadgeContainer = keyListenModal.querySelector(
    ".key-badge-container"
  );
  keyBadgeContainer.innerHTML = "";
  keyListenModal.querySelector(".detected-keys").classList.add("hidden");
  keyListenModal.querySelector(".confirm-key").classList.add("disabled");

  // Show modal
  keyListenModal.classList.remove("hidden");
}

// Close key listen modal
function closeKeyListenModal() {
  listeningForKey = false;
  keyListenModal.classList.add("hidden");
}

// Close all modals
function closeAllModals() {
  closeKeyListenModal();
  closeAssignActionModal();
}

// Handle key detection (simulated)
function handleKeyDetection(e) {
  // Prevent normal keyboard behavior
  e.preventDefault();

  // Simulating that this key came from the macro keyboard
  const key = e.key;
  const modifiers = [];

  if (e.ctrlKey) modifiers.push("Ctrl");
  if (e.altKey) modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");

  // Don't count modifier keys when pressed alone
  if (["Control", "Alt", "Shift"].includes(key)) {
    return;
  }

  currentKey = {
    key: key,
    modifiers: modifiers,
  };

  // Update UI
  const keyBadgeContainer = keyListenModal.querySelector(
    ".key-badge-container"
  );
  keyBadgeContainer.innerHTML = "";

  // Add modifiers
  modifiers.forEach((mod) => {
    const modBadge = document.createElement("span");
    modBadge.className = "key-badge";
    modBadge.textContent = mod;
    keyBadgeContainer.appendChild(modBadge);

    const plus = document.createElement("span");
    plus.textContent = "+";
    keyBadgeContainer.appendChild(plus);
  });

  // Add main key
  const keyBadge = document.createElement("span");
  keyBadge.className = "key-badge";
  keyBadge.textContent = key;
  keyBadgeContainer.appendChild(keyBadge);

  // Show detected key section
  keyListenModal.querySelector(".detected-keys").classList.remove("hidden");
  keyListenModal.querySelector(".confirm-key").classList.remove("disabled");
  // Highlight the key in the SVG
  highlightSvgKey(key.toLowerCase());
}
function highlightSvgKey(key) {
  const svgDoc = svgObject?.contentDocument;

  const instruction = document.querySelector(".listening-instruction");

  if (!svgDoc || !key) {
    instruction.textContent = "SVG not loaded or key not recognized.";
    return;
  }

  const keycode = keyToKeycodeMap[key.toLowerCase()];
  if (!keycode) {
    instruction.textContent = `Key "${key}" not Listed. Try another.`;
    return;
  }

  // Find the <g> with keycode="..."
  const keyGroup = [...svgDoc.querySelectorAll("g")].find(
    (g) => g.getAttribute("keycode") === String(keycode)
  );

  if (!keyGroup) {
    instruction.textContent = `Key "${key}" not found in layout.`;
    return;
  }

  // Clear previous highlights
  svgDoc
    .querySelectorAll(".highlighted-key")
    .forEach((el) => el.classList.remove("highlighted-key"));

  keyGroup.classList.add("highlighted-key");
  instruction.textContent =
    "Press the key or key combination you want to assign.";
}
const keyToKeycodeMap = {
  escape: 27,
  esc: 27,
  f1: 112,
  f2: 113,
  f3: 114,
  f4: 115,
  f5: 116,
  f6: 117,
  f7: 118,
  f8: 119,
  f9: 120,
  f10: 121,
  f11: 122,
  f12: 123,
  a: 65,
  b: 66,
  c: 67,
  d: 68,
  e: 69,
  f: 70,
  g: 71,
  h: 72,
  i: 73,
  j: 74,
  k: 75,
  l: 76,
  m: 77,
  n: 78,
  o: 79,
  p: 80,
  q: 81,
  r: 82,
  s: 83,
  t: 84,
  u: 85,
  v: 86,
  w: 87,
  x: 88,
  y: 89,
  z: 90,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  0: 48,
  enter: 13,
  " ": 32,
  space: 32,
  tab: 9,
  shift: 16,
  control: 17,
  alt: 18,
  capslock: 20,
  backspace: 8,
  delete: 46,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  arrowup: 38,
  arrowdown: 40,
  arrowleft: 37,
  arrowright: 39,
  // Add more as needed
};

// Open assign action modal
function openAssignActionModal() {
  if (!currentKey) {
    return;
  }

  // Close key listen modal
  closeKeyListenModal();

  // Set up the selected key UI
  const keyBadgeContainer = assignActionModal.querySelector(
    ".selected-key .key-badge"
  );
  keyBadgeContainer.textContent = currentKey.key;

  // Reset action type
  actionTypeSelect.value = "launch";
  updateDynamicForm();

  // Show modal
  assignActionModal.classList.remove("hidden");
}

// Close assign action modal
function closeAssignActionModal() {
  assignActionModal.classList.add("hidden");
}

// Update dynamic form based on selected action type
function updateDynamicForm() {
  const actionType = actionTypeSelect.value;
  let formHtml = "";

  switch (actionType) {
    case "launch":
      formHtml = `
                <div class="form-group">
                    <label for="app-path">Application Path</label>
                    <div class="input-with-button">
                        <input type="text" id="app-path" placeholder="C:\\Path\\To\\Application.exe">
                        <button class="browse-button"><i class="fas fa-folder-open"></i></button>
                    </div>
                </div>
            `;
      break;
    case "hotkey":
      formHtml = `
                <div class="form-group">
                    <label for="hotkey-combo">Hotkey Combination</label>
                    <input type="text" id="hotkey-combo" placeholder="Ctrl+C, Alt+Tab, etc.">
                </div>
            `;
      break;
    case "volume":
      formHtml = `
                <div class="form-group">
                    <label for="volume-command">Volume Command</label>
                    <select id="volume-command">
                        <option value="up">Volume Up</option>
                        <option value="down">Volume Down</option>
                        <option value="mute">Toggle Mute</option>
                    </select>
                </div>
            `;
      break;
    case "media":
      formHtml = `
                <div class="form-group">
                    <label for="media-command">Media Command</label>
                    <select id="media-command">
                        <option value="play_pause">Play/Pause</option>
                        <option value="next_track">Next Track</option>
                        <option value="prev_track">Previous Track</option>
                        <option value="stop">Stop</option>
                    </select>
                </div>
            `;
      break;
    case "script":
      formHtml = `
                <div class="form-group">
                    <label for="script-path">Script Path</label>
                    <div class="input-with-button">
                        <input type="text" id="script-path" placeholder="C:\\Path\\To\\Script.py">
                        <button class="browse-button"><i class="fas fa-folder-open"></i></button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="script-args">Arguments (Optional)</label>
                    <input type="text" id="script-args" placeholder="--arg1 value1 --arg2 value2">
                </div>
            `;
      break;
  }

  dynamicFormContainer.innerHTML = formHtml;

  // Add event listeners for browse buttons
  const browseButtons = dynamicFormContainer.querySelectorAll(".browse-button");
  browseButtons.forEach((button) => {
    button.addEventListener("click", simulateBrowseDialog);
  });
}

// Simulate file browser dialog
function simulateBrowseDialog() {
  // In a real app, this would open a native file picker
  // For demo, we'll just set a sample path
  const input = this.previousElementSibling;

  if (input.id === "app-path") {
    input.value = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
  } else if (input.id === "script-path") {
    input.value = "C:\\Scripts\\my_macro.py";
  }
}

// Save action
function saveAction() {
  if (!currentKey) {
    return;
  }

  const actionType = actionTypeSelect.value;
  let action = {};

  // Get action data based on type
  switch (actionType) {
    case "launch":
      action.path = document.getElementById("app-path").value;
      break;
    case "hotkey":
      action.keys = document.getElementById("hotkey-combo").value;
      break;
    case "volume":
      action.command = document.getElementById("volume-command").value;
      break;
    case "media":
      action.command = document.getElementById("media-command").value;
      break;
    case "script":
      action.path = document.getElementById("script-path").value;
      action.args = document.getElementById("script-args").value;
      break;
  }

  // Validate required fields
  if ((actionType === "launch" || actionType === "script") && !action.path) {
    alert("Please enter a path");
    return;
  }
  if (actionType === "hotkey" && !action.keys) {
    alert("Please enter a hotkey combination");
    return;
  }

  // Generate unique ID
  const shortcutId = "shortcut_" + Date.now();

  // Create new shortcut
  const newShortcut = {
    id: shortcutId,
    key: currentKey.key,
    modifiers: currentKey.modifiers,
    actionType: actionType,
    action: action,
  };

  // Add to shortcuts array
  shortcuts.push(newShortcut);

  // Update UI
  renderShortcuts();

  // Close modal
  closeAssignActionModal();

  // Show success message
  showToast("Shortcut added successfully!");
}

// Edit shortcut
function editShortcut(shortcutId) {
  const shortcut = shortcuts.find((s) => s.id === shortcutId);

  if (!shortcut) {
    return;
  }

  // Set current key for use in assign action
  currentKey = {
    key: shortcut.key,
    modifiers: shortcut.modifiers,
  };

  // Remove the shortcut (will be added back on save)
  shortcuts = shortcuts.filter((s) => s.id !== shortcutId);

  // Open assign action modal directly
  openAssignActionModal();

  // Fill in form values based on existing shortcut
  actionTypeSelect.value = shortcut.actionType;
  updateDynamicForm();

  // Set form values based on action type
  setTimeout(() => {
    switch (shortcut.actionType) {
      case "launch":
        document.getElementById("app-path").value = shortcut.action.path || "";
        break;
      case "hotkey":
        document.getElementById("hotkey-combo").value =
          shortcut.action.keys || "";
        break;
      case "volume":
        document.getElementById("volume-command").value =
          shortcut.action.command || "up";
        break;
      case "media":
        document.getElementById("media-command").value =
          shortcut.action.command || "play_pause";
        break;
      case "script":
        document.getElementById("script-path").value =
          shortcut.action.path || "";
        document.getElementById("script-args").value =
          shortcut.action.args || "";
        break;
    }
  }, 10);
}

// Delete shortcut
function deleteShortcut(shortcutId) {
  if (confirm("Are you sure you want to delete this shortcut?")) {
    shortcuts = shortcuts.filter((s) => s.id !== shortcutId);
    renderShortcuts();
    showToast("Shortcut deleted");
  }
}

// Save profile
function saveProfile() {
  // In a real app, this would send data to the backend
  console.log(`Saving profile ${currentProfile}:`, shortcuts);
  showToast(`Profile '${currentProfile}' saved successfully!`);
}

// Show toast notification
function showToast(message) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle toast-icon"></i>
            <span>${message}</span>
        </div>
    `;

  // Add to container
  toastContainer.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
// Function to handle showing View Actions panel
function showViewActions() {
  // Show View Actions panel
  viewActionsPanel.classList.remove("hidden");
}

// Function to hide View Actions panel
function hideViewActions() {
  // Hide View Actions panel
  viewActionsPanel.classList.add("hidden");
}

// Function to handle showing View assign Macros panel
function showAssignMacros() {
  // Show View Actions panel
  assignMacrosPanel.classList.remove("hidden");
}

// Function to hide View Actions panel
function hideAssignMacros() {
  // Hide View Actions panel
  assignMacrosPanel.classList.add("hidden");
}

// Function to filter action cards
function filterActions(category) {
  actionCards.forEach((card) => {
    if (category === "all" || card.getAttribute("data-category") === category) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Set up filter button event listeners
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Update active filter button
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Filter cards
    const category = button.getAttribute("data-filter");
    filterActions(category);
  });
});

// Make action cards clickable (to use as template)
actionCards.forEach((card) => {
  card.addEventListener("click", () => {
    // Open assign action modal with pre-selected action type
    const actionTitle = card.querySelector(".action-card-title").textContent;
    showToast(`Selected action type: ${actionTitle}`, "success");

    // If needed, you can open the key listen modal here
    // openKeyListenModal();
  });
});

// Toast notification system
function showToast(message, type = "success") {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Toast content
  const icon =
    type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
  toast.innerHTML = `
        <div class="toast-content">
            <i class="toast-icon ${icon}"></i>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-dismiss">
            <i class="fas fa-times"></i>
        </button>
    `;

  // Add to container
  toastContainer.appendChild(toast);

  // Add dismiss functionality
  toast.querySelector(".toast-dismiss").addEventListener("click", () => {
    removeToast(toast);
  });

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    removeToast(toast);
  }, 4000);
}

// Remove toast with animation
function removeToast(toast) {
  toast.style.animation = "slideOut 0.3s forwards";
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Update navigation link handler
function setActiveNavLink(activeLink) {
  navLinks.forEach((link) => {
    link.classList.remove("active");
  });
  activeLink.classList.add("active");

  // Handle mode switching logic
  const mode = activeLink.getAttribute("data-mode");
  console.log(`Switched to ${mode} mode`);

  // Handle different views
  if (mode === "view") {
    showViewActions();
  } else {
    hideViewActions();
  }
  if (mode === "settings") {
    showGlobalSettingsPanel();
  } else {
    hideGlobalSettingsPanel();
  }
  if (mode === "assign") {
    showAssignMacros();
  } else {
    hideAssignMacros();
  }
}

// Global settings variables
const globalSettings = {
  unusedKeys: "disable",
  keyHoldDuration: 300,
  repeatRate: 150,
  autoConnect: true,
  exclusiveMode: true,
  devicePolling: 8,
  keyDebounce: 10,
  debugMode: false,
};

// Initialize settings controls
function initializeSettingsControls() {
  // Set initial values from globalSettings
  document.getElementById("unused-keys").value = globalSettings.unusedKeys;
  holdDurationSlider.value = globalSettings.keyHoldDuration;
  holdDurationValue.textContent = globalSettings.keyHoldDuration;
  repeatRateSlider.value = globalSettings.repeatRate;
  repeatRateValue.textContent = globalSettings.repeatRate;
  document.getElementById("auto-connect").checked = globalSettings.autoConnect;
  document.getElementById("exclusive-mode").checked =
    globalSettings.exclusiveMode;
  document.getElementById("device-polling").value =
    globalSettings.devicePolling;
  debounceSlider.value = globalSettings.keyDebounce;
  debounceValue.textContent = globalSettings.keyDebounce;
  document.getElementById("debug-mode").checked = globalSettings.debugMode;

  // Add event listeners for range sliders
  holdDurationSlider.addEventListener("input", () => {
    holdDurationValue.textContent = holdDurationSlider.value;
  });

  repeatRateSlider.addEventListener("input", () => {
    repeatRateValue.textContent = repeatRateSlider.value;
  });

  debounceSlider.addEventListener("input", () => {
    debounceValue.textContent = debounceSlider.value;
  });

  // Add event listeners for buttons
  resetSettingsBtn.addEventListener("click", resetSettings);
  saveSettingsBtn.addEventListener("click", saveSettings);
}

// Reset settings to default values
function resetSettings() {
  const defaultSettings = {
    unusedKeys: "disable",
    keyHoldDuration: 300,
    repeatRate: 150,
    autoConnect: true,
    exclusiveMode: true,
    devicePolling: 8,
    keyDebounce: 10,
    debugMode: false,
  };

  // Update globalSettings
  Object.assign(globalSettings, defaultSettings);

  // Update UI
  document.getElementById("unused-keys").value = defaultSettings.unusedKeys;
  holdDurationSlider.value = defaultSettings.keyHoldDuration;
  holdDurationValue.textContent = defaultSettings.keyHoldDuration;
  repeatRateSlider.value = defaultSettings.repeatRate;
  repeatRateValue.textContent = defaultSettings.repeatRate;
  document.getElementById("auto-connect").checked = defaultSettings.autoConnect;
  document.getElementById("exclusive-mode").checked =
    defaultSettings.exclusiveMode;
  document.getElementById("device-polling").value =
    defaultSettings.devicePolling;
  debounceSlider.value = defaultSettings.keyDebounce;
  debounceValue.textContent = defaultSettings.keyDebounce;
  document.getElementById("debug-mode").checked = defaultSettings.debugMode;

  showToast("Settings reset to defaults");
}

// Save current settings
function saveSettings() {
  // Update globalSettings from UI
  globalSettings.unusedKeys = document.getElementById("unused-keys").value;
  globalSettings.keyHoldDuration = parseInt(holdDurationSlider.value);
  globalSettings.repeatRate = parseInt(repeatRateSlider.value);
  globalSettings.autoConnect = document.getElementById("auto-connect").checked;
  globalSettings.exclusiveMode =
    document.getElementById("exclusive-mode").checked;
  globalSettings.devicePolling = parseInt(
    document.getElementById("device-polling").value
  );
  globalSettings.keyDebounce = parseInt(debounceSlider.value);
  globalSettings.debugMode = document.getElementById("debug-mode").checked;

  // Save to localStorage (would be server in real app)
  localStorage.setItem("coldkeys_settings", JSON.stringify(globalSettings));

  // Apply settings to application
  applySettings();

  showToast("Settings saved successfully");
}

// Apply settings to application
function applySettings() {
  // Here you would implement the actual application of settings
  // For example, updating device manager with new polling rate
  console.log("Applied settings:", globalSettings);

  // Toggle debug mode
  if (globalSettings.debugMode) {
    console.log("Debug mode enabled");
  }
}

// Load settings from storage
function loadSettings() {
  const savedSettings = localStorage.getItem("coldkeys_settings");
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings);
      Object.assign(globalSettings, parsedSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }
}

// Update to show global settings panel when settings mode is selected
function showGlobalSettingsPanel() {
  // Hide other panels
  document.querySelector("#assign-macros-panel").classList.add("hidden");
  document.getElementById("add-shortcut").classList.add("hidden");

  // Show settings panel
  globalSettingsPanel.classList.remove("hidden");
}

function hideGlobalSettingsPanel() {
  // Show other panels
  document.querySelector("#assign-macros-panel").classList.remove("hidden");
  document.getElementById("add-shortcut").classList.remove("hidden");

  // Hide settings panel
  globalSettingsPanel.classList.add("hidden");
}

// Add these lines to the initializeApp function
function initializeApp() {
  // Fetch available devices
  fetchDevices();

  // Load default profile
  loadProfile(currentProfile);

  // Update theme
  updateTheme();

  // Load and initialize settings
  loadSettings();
  initializeSettingsControls();
}
