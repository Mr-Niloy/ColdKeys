class MacroRecorder {
  constructor() {
    this.isRecording = false;
    this.isPaused = false;
    this.actions = [];
    this.startTime = null;
    this.actionCounter = 0;
    this.recordingDuration = 0;
    this.durationInterval = null;
    this.keyHoldTracking = new Map();
    this.keyPressTimers = new Map();
    this.mouseTracking = {
      isMoving: false,
      lastPosition: { x: 0, y: 0 },
      moveStartTime: 0,
      lastRecordTime: 0,
      moveStartId: null,
    };

    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.recordBtn = document.getElementById("recordBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.saveBtn = document.getElementById("saveBtn");
    this.statusIndicator = document.getElementById("statusIndicator");
    this.statusText = document.getElementById("statusText");
    this.recordBtnText = document.getElementById("recordBtnText");
    this.tableBody = document.getElementById("macroTableBody");
    this.totalActionsEl = document.getElementById("totalActions");
    this.recordingDurationEl = document.getElementById("recordingDuration");
    this.keystrokesEl = document.getElementById("keystrokes");
    this.mouseActionsEl = document.getElementById("mouseActions");
  }
  removeAction(actionId) {
    this.actions = this.actions.filter((action) => action.id !== actionId);
    const row = document.querySelector(`tr[data-id="${actionId}"]`);
    if (row) row.remove();
    this.updateStats();

    // Check if empty
    if (this.actions.length === 0) {
      this.showEmptyState();
    }
  }
  bindEvents() {
    this.recordBtn.addEventListener("click", () => this.toggleRecording());
    this.pauseBtn.addEventListener("click", () => this.pauseRecording());
    this.stopBtn.addEventListener("click", () => this.stopRecording());
    this.clearBtn.addEventListener("click", () => this.clearActions());
    this.saveBtn.addEventListener("click", () => this.saveMacro());
    document.addEventListener("wheel", (e) => this.handleWheelEvent(e));

    // Demo event listeners (simulating real capture)
    document.addEventListener("keydown", (e) =>
      this.handleKeyEvent(e, "keydown")
    );
    document.addEventListener("keyup", (e) => this.handleKeyEvent(e, "keyup"));
    document.addEventListener("mousedown", (e) =>
      this.handleMouseEvent(e, "mousedown")
    );
    document.addEventListener("mouseup", (e) =>
      this.handleMouseEvent(e, "mouseup")
    );
    document.addEventListener("mousemove", (e) =>
      this.handleMouseEvent(e, "mousemove")
    );
    // Add input change handlers
    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("timestamp-input")) {
        this.updateActionValue(
          e.target.dataset.id,
          "timestamp",
          parseFloat(e.target.value)
        );
        this.recalculateDelays(); // Recalculate delays when timestamp changes
      } else if (e.target.classList.contains("duration-input")) {
        this.updateActionValue(
          e.target.dataset.id,
          "duration",
          parseFloat(e.target.value)
        );
      } else if (e.target.classList.contains("delay-input")) {
        this.updateActionValue(
          e.target.dataset.id,
          "delay",
          parseFloat(e.target.value)
        );
      }
    });
  }
  updateActionValue(actionId, field, value) {
    const action = this.actions.find((a) => a.id == actionId);
    if (action) {
      action[field] = value;
    }
  }

  toggleRecording() {
    if (!this.isRecording) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  startRecording() {
    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.recordingDuration = 0;

    this.recordBtn.classList.add("recording");
    this.recordBtnText.textContent = "Stop Recording";
    this.recordBtn.querySelector("i").className = "fas fa-stop";
    this.pauseBtn.disabled = false;
    this.stopBtn.disabled = false;

    this.statusIndicator.classList.add("recording");
    this.statusText.textContent = "Recording...";

    this.startDurationTimer();
    this.removeEmptyState();
  }
  showEmptyState() {
    this.tableBody.innerHTML = `
        <tr class="empty-state">
            <td colspan="8">
                <div class="empty-icon">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="empty-title">No actions recorded yet</div>
                <div class="empty-subtitle">
                    Click "Start Recording" to begin capturing keystrokes and mouse movements
                </div>
            </td>
        </tr>
    `;
  }

  pauseRecording() {
    if (this.isPaused) {
      this.isPaused = false;
      this.startTime = Date.now() - this.recordingDuration * 1000;
      this.startDurationTimer();
      this.statusText.textContent = "Recording...";
      this.pauseBtn.querySelector("i").className = "fas fa-pause";
    } else {
      this.isPaused = true;
      this.stopDurationTimer();
      this.statusText.textContent = "Paused";
      this.pauseBtn.querySelector("i").className = "fas fa-play";
    }
  }

  stopRecording() {
    this.isRecording = false;
    this.isPaused = false;

    this.recordBtn.classList.remove("recording");
    this.recordBtnText.textContent = "Start Recording";
    this.recordBtn.querySelector("i").className = "fas fa-circle";
    this.pauseBtn.disabled = true;
    this.stopBtn.disabled = true;
    this.pauseBtn.querySelector("i").className = "fas fa-pause";

    this.statusIndicator.classList.remove("recording");
    this.statusText.textContent = "Stopped";

    this.stopDurationTimer();
    if (this.mouseStopTimer) {
      clearTimeout(this.mouseStopTimer);
    }
    if (this.mouseTracking.isMoving) {
      this.handleMouseStop();
    }
  }

  startDurationTimer() {
    this.durationInterval = setInterval(() => {
      if (!this.isPaused) {
        this.recordingDuration = (Date.now() - this.startTime) / 1000;
        this.recordingDurationEl.textContent =
          this.recordingDuration.toFixed(1) + "s";
      }
    }, 100);
  }

  stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }
  recalculateDelays() {
    // Sort actions by timestamp to ensure correct order
    this.actions.sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 0; i < this.actions.length; i++) {
      if (i === 0) {
        this.actions[i].delay = 0;
      } else {
        this.actions[i].delay =
          this.actions[i].timestamp - this.actions[i - 1].timestamp;
      }

      // Update the display
      const delayInput = document.querySelector(
        `.delay-input[data-id="${this.actions[i].id}"]`
      );
      if (delayInput) {
        delayInput.value = this.actions[i].delay.toFixed(3);
      }
    }
  }

  handleKeyEvent(event, type) {
    if (!this.isRecording || this.isPaused) return;
    if (event.target.closest(".recording-controls")) return;

    const keyCode = event.code;

    if (type === "keydown") {
      // If this is a repeat event (key held down), handle as keyhold
      if (event.repeat) {
        // Check if we already logged a keyhold for this key
        if (!this.keyHoldTracking.has(keyCode)) {
          // First repeat - log as keyhold and start tracking
          const action = {
            id: ++this.actionCounter,
            type: "keyboard",
            action: "keyhold",
            key: event.key,
            code: event.code,
            timestamp: this.getRelativeTimestamp(),
            duration: 0, // Will be updated as key continues to be held
            modifiers: {
              ctrl: event.ctrlKey,
              shift: event.shiftKey,
              alt: event.altKey,
              meta: event.metaKey,
            },
          };

          this.keyHoldTracking.set(keyCode, {
            actionId: action.id,
            startTime: Date.now(),
          });

          this.addAction(action);
        } else {
          // Update duration of existing keyhold
          const holdInfo = this.keyHoldTracking.get(keyCode);
          const currentDuration = (Date.now() - holdInfo.startTime) / 1000;
          const action = this.actions.find((a) => a.id === holdInfo.actionId);
          if (action) {
            action.duration = currentDuration;
            // Update the display
            const durationInput = document.querySelector(
              `.duration-input[data-id="${holdInfo.actionId}"]`
            );
            if (durationInput) {
              durationInput.value = currentDuration.toFixed(3);
            }
          }
        }
        return; // Don't log regular keydown for repeats
      }

      // Regular keydown (first press) - start tracking for duration calculation
      this.keyPressTimers = this.keyPressTimers || new Map();
      this.keyPressTimers.set(keyCode, Date.now());

      const action = {
        id: ++this.actionCounter,
        type: "keyboard",
        action: "keydown",
        key: event.key,
        code: event.code,
        timestamp: this.getRelativeTimestamp(),
        duration: 0, // Will be calculated on keyup
        modifiers: {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey,
        },
      };

      this.addAction(action);
    } else if (type === "keyup") {
      // Clean up keyhold tracking if it exists
      if (this.keyHoldTracking.has(keyCode)) {
        const holdInfo = this.keyHoldTracking.get(keyCode);
        const finalDuration = (Date.now() - holdInfo.startTime) / 1000;
        const action = this.actions.find((a) => a.id === holdInfo.actionId);
        if (action) {
          action.duration = finalDuration;
          // Update the display one final time
          const durationInput = document.querySelector(
            `.duration-input[data-id="${holdInfo.actionId}"]`
          );
          if (durationInput) {
            durationInput.value = finalDuration.toFixed(3);
          }
        }
        this.keyHoldTracking.delete(keyCode);
      }

      // Calculate duration for regular key press
      this.keyPressTimers = this.keyPressTimers || new Map();
      const pressStartTime = this.keyPressTimers.get(keyCode);
      const duration = pressStartTime
        ? (Date.now() - pressStartTime) / 1000
        : this.getKeyPressDuration(keyCode);
      this.keyPressTimers.delete(keyCode);

      // Regular keyup
      const action = {
        id: ++this.actionCounter,
        type: "keyboard",
        action: "keyup",
        key: event.key,
        code: event.code,
        timestamp: this.getRelativeTimestamp(),
        duration: duration,
        modifiers: {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey,
        },
      };

      this.addAction(action);
    }
  }

  handleMouseEvent(event, type) {
    if (!this.isRecording || this.isPaused) return;
    if (event.target.closest(".recording-controls")) return;

    if (type === "mousemove") {
      this.handleMouseMove(event);
    } else {
      // Handle regular mouse events (mousedown, mouseup)
      const action = {
        id: ++this.actionCounter,
        type: "mouse",
        action: type,
        button: event.button,
        x: event.clientX,
        y: event.clientY,
        timestamp: this.getRelativeTimestamp(),
        duration: type === "mouseup" ? 0.1 : 0,
      };

      this.addAction(action);
    }
  }
  handleMouseMove(event) {
    const currentPos = { x: event.clientX, y: event.clientY };
    const currentTime = Date.now();

    // Check if mouse actually moved (avoid duplicate positions)
    if (
      currentPos.x === this.mouseTracking.lastPosition.x &&
      currentPos.y === this.mouseTracking.lastPosition.y
    ) {
      return;
    }

    if (!this.mouseTracking.isMoving) {
      // Start of movement
      this.mouseTracking.isMoving = true;
      this.mouseTracking.moveStartTime = currentTime;
      this.mouseTracking.lastRecordTime = currentTime;

      const startAction = {
        id: ++this.actionCounter,
        type: "mouse",
        action: "move_start",
        x: this.mouseTracking.lastPosition.x,
        y: this.mouseTracking.lastPosition.y,
        timestamp: this.getRelativeTimestamp(),
        duration: 0,
      };

      this.mouseTracking.moveStartId = startAction.id;
      this.addAction(startAction);

      // Set up movement end detection
      this.resetMouseStopTimer();
    } else {
      // Calculate movement speed and determine if we should record
      const timeSinceLastRecord =
        currentTime - this.mouseTracking.lastRecordTime;
      const distance = Math.sqrt(
        Math.pow(currentPos.x - this.mouseTracking.lastPosition.x, 2) +
          Math.pow(currentPos.y - this.mouseTracking.lastPosition.y, 2)
      );

      // Calculate speed (pixels per second)
      const speed = distance / (timeSinceLastRecord / 1000);

      // Determine recording frequency based on speed
      // Slow movement: 1 record/s, Fast movement: 10 records/s
      const minInterval = 100; // 10 records/s (100ms)
      const maxInterval = 1000; // 1 record/s (1000ms)
      const speedThreshold = 500; // pixels per second

      let recordInterval;
      if (speed > speedThreshold) {
        recordInterval = minInterval; // Fast movement
      } else {
        // Linear interpolation between min and max based on speed
        const speedRatio = Math.min(speed / speedThreshold, 1);
        recordInterval = maxInterval - speedRatio * (maxInterval - minInterval);
      }

      // Record if enough time has passed based on calculated interval
      if (timeSinceLastRecord >= recordInterval) {
        const moveAction = {
          id: ++this.actionCounter,
          type: "mouse",
          action: "move",
          x: currentPos.x,
          y: currentPos.y,
          timestamp: this.getRelativeTimestamp(),
          duration: 0,
          speed: Math.round(speed), // Add speed info
        };

        this.addAction(moveAction);
        this.mouseTracking.lastRecordTime = currentTime;
      }

      this.resetMouseStopTimer();
    }

    this.mouseTracking.lastPosition = currentPos;
  }
  resetMouseStopTimer() {
    if (this.mouseStopTimer) {
      clearTimeout(this.mouseStopTimer);
    }

    this.mouseStopTimer = setTimeout(() => {
      this.handleMouseStop();
    }, 150); // 150ms of no movement = stopped
  }

  handleMouseStop() {
    if (this.mouseTracking.isMoving) {
      const stopAction = {
        id: ++this.actionCounter,
        type: "mouse",
        action: "move_stop",
        x: this.mouseTracking.lastPosition.x,
        y: this.mouseTracking.lastPosition.y,
        timestamp: this.getRelativeTimestamp(),
        duration:
          this.mouseTracking.lastRecordTime - this.mouseTracking.moveStartTime,
      };

      this.addAction(stopAction);
      this.mouseTracking.isMoving = false;
    }
  }
  handleWheelEvent(event) {
    if (!this.isRecording || this.isPaused) return;
    if (event.target.closest(".recording-controls")) return;

    const action = {
      id: ++this.actionCounter,
      type: "mouse",
      action: "wheel",
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      x: event.clientX,
      y: event.clientY,
      timestamp: this.getRelativeTimestamp(),
      duration: 0,
    };

    this.addAction(action);
  }

  getRelativeTimestamp() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  getKeyPressDuration(code) {
    // Simulate key press duration (random between 0.05 and 0.3 seconds)
    return Math.random() * 0.25 + 0.05;
  }

  addAction(action) {
    // Calculate delay from previous action
    if (this.actions.length > 0) {
      const lastAction = this.actions[this.actions.length - 1];
      action.delay = action.timestamp - lastAction.timestamp;
    } else {
      action.delay = 0; // First action has 0 delay
    }

    this.actions.push(action);
    this.renderAction(action);
    this.updateStats();
    this.scrollToBottom();
  }

  renderAction(action) {
    const row = document.createElement("tr");
    row.className = "row-animation";
    row.setAttribute("data-id", action.id);

    const typeIcon = this.getActionIcon(action);
    const actionDisplay = this.getActionDisplay(action);
    const detailsDisplay = this.getDetailsDisplay(action);
    const positionDisplay = this.getPositionDisplay(action);

    row.innerHTML = `
    <td>${action.id}</td>
    <td>
        <div class="action-type">
            <div class="action-icon ${action.type}">
                <i class="${typeIcon}"></i>
            </div>
            ${action.type}
        </div>
    </td>
    <td>${actionDisplay}</td>
    <td class="action-details">${detailsDisplay}</td>
    <td><input type="number" class="editable-input timestamp-input" value="${action.timestamp.toFixed(
      3
    )}" step="0.001" min="0" data-id="${action.id}"></td>
    <td><input type="number" class="editable-input delay-input" value="${action.delay.toFixed(
      3
    )}" step="0.001" min="0" data-id="${action.id}"></td>
    <td><input type="number" class="editable-input duration-input" value="${action.duration.toFixed(
      3
    )}" step="0.001" min="0" data-id="${action.id}"></td>
    <td class="coordinates">${positionDisplay}</td>
    <td>
        <button class="control-button delete" onclick="removeAction(${
          action.id
        })" title="Remove Action">
            <i class="fa-solid fa-eraser"></i>
        </button>
    </td>
`;

    this.tableBody.appendChild(row);
  }

  getActionIcon(action) {
    if (action.type === "keyboard") {
      switch (action.action) {
        case "keydown":
          return "fas fa-arrow-down";
        case "keyup":
          return "fas fa-arrow-up";
        case "keyhold":
          return "fas fa-hand-paper";
        default:
          return "fas fa-keyboard";
      }
    } else if (action.type === "mouse") {
      switch (action.action) {
        case "mousedown":
          return "fas fa-hand-pointer";
        case "mouseup":
          return "fas fa-hand-paper";
        case "wheel":
          return "fas fa-circle-notch";
        case "move_start":
          return "fas fa-play";
        case "move":
          return "fas fa-arrows-alt";
        case "move_stop":
          return "fas fa-stop";
        case "mousemove":
          return "fas fa-mouse"; // fallback
        default:
          return "fas fa-mouse";
      }
    }
    return "fas fa-question";
  }

  getActionDisplay(action) {
    if (action.type === "keyboard") {
      const modifiers = [];
      if (action.modifiers.ctrl) modifiers.push("Ctrl");
      if (action.modifiers.shift) modifiers.push("Shift");
      if (action.modifiers.alt) modifiers.push("Alt");
      if (action.modifiers.meta) modifiers.push("Meta");

      const keyDisplay = `<span class="key-badge">${action.key}</span>`;
      const modifierDisplay = modifiers
        .map((mod) => `<span class="key-badge">${mod}</span>`)
        .join(" + ");

      return modifierDisplay
        ? `${modifierDisplay} + ${keyDisplay}`
        : keyDisplay;
    } else {
      switch (action.action) {
        case "wheel":
          return `WHEEL ${action.deltaY > 0 ? "↓" : "↑"}`;
        case "move_start":
          return "MOVE START";
        case "move":
          return "MOVING";
        case "move_stop":
          return "MOVE STOP";
        default:
          return action.action.replace("mouse", "").toUpperCase();
      }
    }
  }

  getDetailsDisplay(action) {
    if (action.type === "keyboard") {
      return `Code: ${action.code} | As: ${action.action}`;
    } else {
      if (action.action === "wheel") {
        return `${action.deltaX != "0" ? `ΔX: ${action.deltaX} | ` : ""}ΔY: ${
          action.deltaY
        } | As: ${action.action}-${action.deltaY > 0 ? "down" : "up"}`;
      } else if (action.action === "move" && action.speed) {
        return `Speed: ${action.speed}px/s | Action: ${action.action}`;
      } else {
        return `Button: ${action.button} | Action: ${action.action}`;
      }
    }
  }

  getPositionDisplay(action) {
    if (action.type === "mouse") {
      return `(${action.x}, ${action.y})`;
    }
    return "-";
  }

  updateStats() {
    this.totalActionsEl.textContent = this.actions.length;

    const keystrokes = this.actions.filter((a) => a.type === "keyboard").length;
    const mouseActions = this.actions.filter((a) => a.type === "mouse").length;

    this.keystrokesEl.textContent = keystrokes;
    this.mouseActionsEl.textContent = mouseActions;
  }

  removeEmptyState() {
    const emptyState = this.tableBody.querySelector(".empty-state");
    if (emptyState) {
      emptyState.remove();
    }
  }

  scrollToBottom() {
    const container = document.querySelector(".macro-table-container");
    container.scrollTop = container.scrollHeight;
  }

  clearActions() {
    if (confirm("Are you sure you want to clear all recorded actions?")) {
      this.actions = [];
      this.actionCounter = 0;
      this.recordingDuration = 0;
      this.recordingDurationEl.textContent = "0.0s";

      this.tableBody.innerHTML = `
                              <tr class="empty-state">
                                  <td colspan="9">
                                      <div class="empty-icon">
                                          <i class="fas fa-keyboard"></i>
                                      </div>
                                      <div class="empty-title">No actions recorded yet</div>
                                      <div class="empty-subtitle">
                                          Click "Start Recording" to begin capturing keystrokes and mouse movements
                                      </div>
                                  </td>
                              </tr>
                          `;

      this.updateStats();
    }
  }

  saveMacro() {
    if (this.actions.length === 0) {
      alert("No actions to save!");
      return;
    }

    const macroData = {
      name: prompt("Enter macro name:", `Macro_${Date.now()}`),
      actions: this.actions,
      duration: this.recordingDuration,
      createdAt: new Date().toISOString(),
    };

    if (macroData.name) {
      // Simulate saving to backend
      console.log("Saving macro:", macroData);
      alert(
        `Macro "${macroData.name}" saved successfully!\n\nActions: ${
          this.actions.length
        }\nDuration: ${this.recordingDuration.toFixed(2)}s`
      );
    }
  }
}

// Initialize the macro recorder when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new MacroRecorder();
});
