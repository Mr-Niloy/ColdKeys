class NodeEditor {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map();
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragNode = null;
    this.isPanning = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.selectedPin = null;
    this.tempConnection = null;
    this.nodeCounter = 0;
    this.canvas = document.getElementById("canvas");
    this.nodesLayer = document.getElementById("nodesLayer");
    this.connectionsLayer = document.getElementById("connectionsLayer");
    this.canvasContainer = document.getElementById("canvasContainer");

    this.nodes = new Map();
    this.connections = new Map();
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragNode = null;
    this.isPanning = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.selectedPin = null;
    this.tempConnection = null;
    this.nodeCounter = 0;
    this.connectionUpdateQueued = false;

    this.nodeTemplates = {
    // Input Only Nodes
    'Time Trigger': {
        type: 'input',
        category: 'input',
        icon: 'fas fa-clock',
        pins: {
            inputs: [],
            outputs: [
                { name: 'tick', data_type: 'flow' },
                { name: 'timestamp', data_type: 'time' }
            ]
        }
    },
    'Key Trigger': {
        type: 'input',
        category: 'input',
        icon: 'fas fa-keyboard',
        pins: {
            inputs: [],
            outputs: [
                { name: 'key', data_type: 'key' },
                { name: 'device', data_type: 'device' },
                { name: 'action', data_type: 'string' }
            ]
        }
    },
    'Mouse Trigger': {
        type: 'input',
        category: 'input',
        icon: 'fas fa-mouse',
        pins: {
            inputs: [],
            outputs: [
                { name: 'button', data_type: 'string' },
                { name: 'click_type', data_type: 'string' },
                { name: 'position', data_type: 'string' }
            ]
        }
    },
    'Window Focus': {
        type: 'input',
        category: 'input',
        icon: 'fas fa-window-maximize',
        pins: {
            inputs: [],
            outputs: [
                { name: 'app_name', data_type: 'string' },
                { name: 'window_title', data_type: 'string' },
                { name: 'focused', data_type: 'bool' }
            ]
        }
    },
    'Device Connect': {
        type: 'input',
        category: 'input',
        icon: 'fa-brands fa-usb',
        pins: {
            inputs: [],
            outputs: [
                { name: 'device', data_type: 'device' },
                { name: 'connected', data_type: 'bool' }
            ]
        }
    },
    'System Event': {
        type: 'input',
        category: 'input',
        icon: 'fas fa-desktop',
        pins: {
            inputs: [],
            outputs: [
                { name: 'event_type', data_type: 'string' },
                { name: 'timestamp', data_type: 'time' }
            ]
        }
    },

    // Output Only Nodes
    'Pass to OS': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-share',
        pins: {
            inputs: [
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Block Input': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-ban',
        pins: {
            inputs: [
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Send Notification': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-bell',
        pins: {
            inputs: [
                { name: 'title', data_type: 'string' },
                { name: 'message', data_type: 'string' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Show Overlay': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-layer-group',
        pins: {
            inputs: [
                { name: 'text', data_type: 'string' },
                { name: 'timeout', data_type: 'number' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Run Script': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-code',
        pins: {
            inputs: [
                { name: 'script_path', data_type: 'string' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Open App': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-external-link-alt',
        pins: {
            inputs: [
                { name: 'path', data_type: 'string' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Write to File': {
        type: 'output',
        category: 'output',
        icon: 'fas fa-file-alt',
        pins: {
            inputs: [
                { name: 'path', data_type: 'string' },
                { name: 'content', data_type: 'string' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },

    // Logic/Bidirectional Nodes
    'Condition': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-code-branch',
        pins: {
            inputs: [
                { name: 'condition', data_type: 'bool' },
                { name: 'input', data_type: 'flow' }
            ],
            outputs: [
                { name: 'true', data_type: 'flow' },
                { name: 'false', data_type: 'flow' }
            ]
        }
    },
    'Switch/Case': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-random',
        pins: {
            inputs: [
                { name: 'value', data_type: 'string' },
                { name: 'input', data_type: 'flow' }
            ],
            outputs: [
                { name: 'case_1', data_type: 'flow' },
                { name: 'case_2', data_type: 'flow' },
                { name: 'default', data_type: 'flow' }
            ]
        }
    },
    'Wait/Delay': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-hourglass-half',
        pins: {
            inputs: [
                { name: 'time_ms', data_type: 'number' },
                { name: 'input', data_type: 'flow' }
            ],
            outputs: [
                { name: 'output', data_type: 'flow' }
            ]
        }
    },
    'Loop': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-redo',
        pins: {
            inputs: [
                { name: 'count', data_type: 'number' },
                { name: 'input', data_type: 'flow' }
            ],
            outputs: [
                { name: 'iteration', data_type: 'flow' },
                { name: 'complete', data_type: 'flow' }
            ]
        }
    },
    'Compare': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-balance-scale',
        pins: {
            inputs: [
                { name: 'value_a', data_type: 'number' },
                { name: 'value_b', data_type: 'number' }
            ],
            outputs: [
                { name: 'result', data_type: 'bool' }
            ]
        }
    },
    'Math': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-calculator',
        pins: {
            inputs: [
                { name: 'a', data_type: 'number' },
                { name: 'b', data_type: 'number' }
            ],
            outputs: [
                { name: 'result', data_type: 'number' }
            ]
        }
    },
    'String Join/Split': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-text-width',
        pins: {
            inputs: [
                { name: 'input_a', data_type: 'string' },
                { name: 'input_b', data_type: 'string' },
                { name: 'separator', data_type: 'string' }
            ],
            outputs: [
                { name: 'result', data_type: 'string' }
            ]
        }
    },
    'Convert Type': {
        type: 'logic',
        category: 'logic',
        icon: 'fas fa-exchange-alt',
        pins: {
            inputs: [
                { name: 'input', data_type: 'string' }
            ],
            outputs: [
                { name: 'string', data_type: 'string' },
                { name: 'number', data_type: 'number' },
                { name: 'bool', data_type: 'bool' }
            ]
        }
    },

    // Device Info Nodes
    'Device Name': {
        type: 'device_info',
        category: 'device_info',
        icon: 'fas fa-tag',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' }
            ],
            outputs: [
                { name: 'name', data_type: 'string' }
            ]
        }
    },
    'Polling Rate': {
        type: 'device_info',
        category: 'device_info',
        icon: 'fas fa-tachometer-alt',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' }
            ],
            outputs: [
                { name: 'rate_hz', data_type: 'number' }
            ]
        }
    },
    'Vendor/Product ID': {
        type: 'device_info',
        category: 'device_info',
        icon: 'fas fa-fingerprint',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' }
            ],
            outputs: [
                { name: 'vendor_id', data_type: 'string' },
                { name: 'product_id', data_type: 'string' }
            ]
        }
    },
    'Device Type': {
        type: 'device_info',
        category: 'device_info',
        icon: 'fas fa-microchip',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' }
            ],
            outputs: [
                { name: 'type', data_type: 'string' }
            ]
        }
    },
    'Connected State': {
        type: 'device_info',
        category: 'device_info',
        icon: 'fas fa-plug',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' }
            ],
            outputs: [
                { name: 'connected', data_type: 'bool' }
            ]
        }
    },

    // Device Output Nodes
    'Set LED Color': {
        type: 'device_output',
        category: 'device_output',
        icon: 'fas fa-lightbulb',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' },
                { name: 'key', data_type: 'key' },
                { name: 'color', data_type: 'string' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Vibrate Device': {
        type: 'device_output',
        category: 'device_output',
        icon: 'fas fa-mobile-alt',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' },
                { name: 'intensity', data_type: 'number' },
                { name: 'duration', data_type: 'number' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    },
    'Play Sound': {
        type: 'device_output',
        category: 'device_output',
        icon: 'fas fa-volume-up',
        pins: {
            inputs: [
                { name: 'device', data_type: 'device' },
                { name: 'frequency', data_type: 'number' },
                { name: 'duration', data_type: 'number' },
                { name: 'trigger', data_type: 'flow' }
            ],
            outputs: []
        }
    }
};

this.nodeCategories = {
    'input': {
        title: 'Input Nodes',
        icon: 'fas fa-sign-in-alt',
        color: '#81c784'
    },
    'output': {
        title: 'Output Nodes',  
        icon: 'fas fa-sign-out-alt',
        color: '#f44336'
    },
    'logic': {
        title: 'Logic Nodes',
        icon: 'fas fa-cogs',
        color: '#ff9800'
    },
    'device_info': {
        title: 'Device Info',
        icon: 'fas fa-info-circle',
        color: '#ba68c8'
    },
    'device_output': {
        title: 'Device Output',
        icon: 'fas fa-broadcast-tower',
        color: '#64b5f6'
    }
};
    this.initEvents();

    this.initializeSidebar(); // ADD THIS
    this.initContextMenu();   // ADD THIS
  }
  initializeSidebar() {
    this.buildSidebar();
    this.initSidebarEvents();
}

buildSidebar() {
    const sidebarContent = document.getElementById('sidebarContent');
    sidebarContent.innerHTML = '';

    Object.entries(this.nodeCategories).forEach(([categoryId, category]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'node-category';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `<i class="${category.icon}"></i>${category.title}`;
        header.dataset.category = categoryId;
        
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'category-nodes';
        nodesContainer.dataset.category = categoryId;
        
        // Add nodes to category
        Object.entries(this.nodeTemplates).forEach(([nodeName, nodeData]) => {
            if (nodeData.category === categoryId) {
                const nodeItem = document.createElement('div');
                nodeItem.className = 'node-item';
                nodeItem.innerHTML = `<i class="${nodeData.icon}"></i><p>${nodeName}</p>`;
                nodeItem.dataset.nodeName = nodeName;
                nodeItem.addEventListener('click', () => this.addNode(nodeData.type, nodeName));
                nodesContainer.appendChild(nodeItem);
            }
        });
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(nodesContainer);
        sidebarContent.appendChild(categoryDiv);
    });
}

initSidebarEvents() {
    // Toggle sidebar
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
    
    // Category collapse/expand
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            const category = header.dataset.category;
            const nodesContainer = document.querySelector(`.category-nodes[data-category="${category}"]`);
            nodesContainer.classList.toggle('collapsed');
        });
    });
}

initContextMenu() {
    this.canvasContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY);
    });
    
    document.addEventListener('click', () => {
        this.hideContextMenu();
    });
}

showContextMenu(x, y) {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.innerHTML = '';
    
    Object.entries(this.nodeCategories).forEach(([categoryId, category]) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.innerHTML = `<i class="${category.icon}"></i>${category.title}`;
        
        const submenu = document.createElement('div');
        submenu.className = 'context-submenu';
        
        // Add nodes to submenu
        Object.entries(this.nodeTemplates).forEach(([nodeName, nodeData]) => {
            if (nodeData.category === categoryId) {
                const subItem = document.createElement('div');
                subItem.className = 'context-menu-item';
                subItem.innerHTML = `<i class="${nodeData.icon}"></i>${nodeName}`;
                subItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = this.canvas.getBoundingClientRect();
                    const canvasX = (x - rect.left - this.panX) / this.scale;
                    const canvasY = (y - rect.top - this.panY) / this.scale;
                    this.addNode(nodeData.type, nodeName, canvasX, canvasY);
                    this.hideContextMenu();
                });
                submenu.appendChild(subItem);
            }
        });
        
        menuItem.appendChild(submenu);
        contextMenu.appendChild(menuItem);
    });
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // Keep menu on screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = `${y - rect.height}px`;
    }
}

hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

  initEvents() {
    this.canvasContainer.addEventListener("wheel", this.handleWheel.bind(this));
    this.canvasContainer.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.canvasContainer.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    this.canvasContainer.addEventListener(
      "mouseup",
      this.handleMouseUp.bind(this)
    );
    this.canvasContainer.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );
  }

  handleWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, this.scale * scaleFactor));

    if (newScale !== this.scale) {
      const scaleChange = newScale / this.scale;
      this.panX = mouseX - (mouseX - this.panX) * scaleChange;
      this.panY = mouseY - (mouseY - this.panY) * scaleChange;
      this.scale = newScale;
      this.updateTransform();
    }
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.panX) / this.scale;
    const y = (e.clientY - rect.top - this.panY) / this.scale;

    if (e.button === 1) {
      // Middle mouse button
      e.preventDefault();
      this.isPanning = true;
      this.canvasContainer.classList.add("grabbing");
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      return;
    }

    const clickedElement = e.target;

    // ADD BETTER PIN DETECTION:
    if (clickedElement.classList.contains("pin-circle")) {
      e.stopPropagation(); // PREVENT EVENT BUBBLING
      this.handlePinClick(clickedElement);
      return;
    }

    // Check if clicked on pin group
    const pinGroup = clickedElement.closest(".pin");
    if (pinGroup) {
      const pinCircle = pinGroup.querySelector(".pin-circle");
      if (pinCircle) {
        e.stopPropagation();
        this.handlePinClick(pinCircle);
        return;
      }
    }

    const nodeElement = clickedElement.closest(".node");
    if (nodeElement) {
      this.dragNode = nodeElement;
      this.isDragging = true;
      this.lastMousePos = { x, y };
    }
  }

  handleMouseMove(e) {
    if (this.isPanning) {
      const deltaX = e.clientX - this.lastMousePos.x;
      const deltaY = e.clientY - this.lastMousePos.y;
      this.panX += deltaX;
      this.panY += deltaY;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.updateTransform();
      return;
    }

    if (this.isDragging && this.dragNode) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.panX) / this.scale;
      const y = (e.clientY - rect.top - this.panY) / this.scale;

      const deltaX = x - this.lastMousePos.x;
      const deltaY = y - this.lastMousePos.y;

      const nodeId = this.dragNode.dataset.nodeId;
      const node = this.nodes.get(nodeId);
      node.position.x += deltaX;
      node.position.y += deltaY;

      this.updateNodePosition(nodeId);
      this.updateConnections();
      this.lastMousePos = { x, y };
    }

    if (this.tempConnection) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.panX) / this.scale;
      const y = (e.clientY - rect.top - this.panY) / this.scale;
      this.updateTempConnection(x, y);
    }
  }

  handleMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.canvasContainer.classList.remove("grabbing");
    }

    this.isDragging = false;
    this.dragNode = null;

    // ADD THIS: Check if we're ending a connection drag
    if (this.tempConnection && this.selectedPin) {
      const clickedElement = e.target;

      // Check if we dropped on a pin
      if (clickedElement.classList.contains("pin-circle")) {
        this.handlePinDrop(clickedElement);
      } else {
        // Check if dropped on pin group
        const pinGroup = clickedElement.closest(".pin");
        if (pinGroup) {
          const pinCircle = pinGroup.querySelector(".pin-circle");
          if (pinCircle) {
            this.handlePinDrop(pinCircle);
          }
        } else {
          // Dropped on empty space, cancel connection
          this.clearPinSelection();
        }
      }
    }
  }
  handlePinDrop(pinElement) {
    console.log("🎯 Pin drop detected:", pinElement);

    const nodeElement = pinElement.closest(".node");
    if (!nodeElement) {
      console.log("❌ No node element found on drop");
      this.clearPinSelection();
      return;
    }

    const nodeId = nodeElement.dataset.nodeId;
    const pinId = pinElement.dataset.pinId;
    const isOutput = pinElement.dataset.pinType === "output";

    console.log("📍 Drop pin details:", { nodeId, pinId, isOutput });
    console.log("📍 Selected pin details:", this.selectedPin);

    // Check if it's a valid connection
    if (
      this.selectedPin.nodeId !== nodeId &&
      this.selectedPin.isOutput !== isOutput
    ) {
      console.log("✅ Valid connection on drop");
      this.createConnection(this.selectedPin, {
        nodeId,
        pinId,
        isOutput,
        element: pinElement,
      });
    } else {
      console.log("❌ Invalid connection on drop:", {
        sameNode: this.selectedPin.nodeId === nodeId,
        sameType: this.selectedPin.isOutput === isOutput,
      });
    }

    this.clearPinSelection();
  }
  handlePinClick(pinElement) {
    console.log("🔵 Pin clicked:", pinElement);

    const nodeElement = pinElement.closest(".node");
    if (!nodeElement) {
      console.log("❌ No node element found");
      return;
    }

    const nodeId = nodeElement.dataset.nodeId;
    const pinId = pinElement.dataset.pinId;
    const isOutput = pinElement.dataset.pinType === "output";

    console.log("📍 Pin details:", { nodeId, pinId, isOutput });

    // If no pin selected, start connection
    if (!this.selectedPin) {
      console.log("🎯 Starting connection from pin");
      this.selectedPin = { nodeId, pinId, isOutput, element: pinElement };
      pinElement.style.stroke = "#ffffff";
      pinElement.style.strokeWidth = "3";
      this.createTempConnection(pinElement);
    } else {
      // If same pin clicked, cancel connection
      if (
        this.selectedPin.nodeId === nodeId &&
        this.selectedPin.pinId === pinId
      ) {
        console.log("🚫 Same pin clicked, canceling connection");
        this.clearPinSelection();
      }
      // Note: We don't handle connection completion here anymore
      // It's handled in handleMouseUp/handlePinDrop
    }
  }
  createTempConnection(pinElement) {
    console.log("➰ Creating temp connection from pin:", pinElement);

    const rect = pinElement.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    const startX =
      (rect.left + rect.width / 2 - canvasRect.left - this.panX) / this.scale;
    const startY =
      (rect.top + rect.height / 2 - canvasRect.top - this.panY) / this.scale;

    console.log("📍 Temp connection start point:", { startX, startY });

    this.tempConnection = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    this.tempConnection.classList.add("temp-connection");
    this.tempConnection.setAttribute(
      "d",
      `M ${startX} ${startY} L ${startX} ${startY}`
    );
    this.connectionsLayer.appendChild(this.tempConnection);

    console.log("✅ Temp connection element created");
  }
  updateTempConnection(endX, endY) {
    if (!this.tempConnection) return;

    const pinElement = this.selectedPin.element;
    const rect = pinElement.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    const startX =
      (rect.left + rect.width / 2 - canvasRect.left - this.panX) / this.scale;
    const startY =
      (rect.top + rect.height / 2 - canvasRect.top - this.panY) / this.scale;

    const path = this.createConnectionPath(startX, startY, endX, endY);
    this.tempConnection.setAttribute("d", path);
  }

  removeTempConnection() {
    if (this.tempConnection) {
      this.tempConnection.remove();
      this.tempConnection = null;
    }
  }

  clearPinSelection() {
    console.log("🧹 Clearing pin selection");
    if (this.selectedPin) {
      this.selectedPin.element.style.stroke = "";
      this.selectedPin.element.style.strokeWidth = "";
      console.log("🎯 Pin selection cleared");
      this.selectedPin = null;
    }
    this.removeTempConnection();
  }

  createConnection(fromPin, toPin) {
    console.log("🔧 Creating connection between:", fromPin, toPin);

    const outputPin = fromPin.isOutput ? fromPin : toPin;
    const inputPin = fromPin.isOutput ? toPin : fromPin;

    console.log("📤 Output pin:", outputPin);
    console.log("📥 Input pin:", inputPin);

    const connectionId = `${outputPin.nodeId}-${outputPin.pinId}-${inputPin.nodeId}-${inputPin.pinId}`;
    console.log("🆔 Connection ID:", connectionId);

    if (this.connections.has(connectionId)) {
      console.log("⚠️ Connection already exists");
      return;
    }

    const outputNode = this.nodes.get(outputPin.nodeId);
    const inputNode = this.nodes.get(inputPin.nodeId);

    console.log("🏢 Output node:", outputNode);
    console.log("🏢 Input node:", inputNode);

    if (!outputNode || !inputNode) {
      console.log("❌ Node not found");
      return;
    }

    const outputPinData = outputNode.pins.outputs.find(
      (p) => p.local_id === outputPin.pinId
    );
    const inputPinData = inputNode.pins.inputs.find(
      (p) => p.local_id === inputPin.pinId
    );

    console.log("📋 Output pin data:", outputPinData);
    console.log("📋 Input pin data:", inputPinData);

    if (!outputPinData || !inputPinData) {
      console.log("❌ Pin data not found");
      return;
    }

    if (outputPinData.data_type !== inputPinData.data_type) {
      console.log(
        "❌ Data type mismatch:",
        outputPinData.data_type,
        "vs",
        inputPinData.data_type
      );
      return;
    }

    console.log(
      "✅ Creating connection with matching types:",
      outputPinData.data_type
    );

    const connection = {
      id: connectionId,
      from: outputPin,
      to: inputPin,
      dataType: outputPinData.data_type,
    };

    this.connections.set(connectionId, connection);
    console.log("💾 Connection stored:", connection);
    this.renderConnection(connection);
  }
  renderConnection(connection) {
    const fromElement = document.querySelector(
      `[data-node-id="${connection.from.nodeId}"] [data-pin-id="${connection.from.pinId}"]`
    );
    const toElement = document.querySelector(
      `[data-node-id="${connection.to.nodeId}"] [data-pin-id="${connection.to.pinId}"]`
    );

    if (!fromElement || !toElement) return;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("connection", `connection-${connection.dataType}`);
    path.dataset.connectionId = connection.id;

    this.connectionsLayer.appendChild(path);
    this.updateConnectionPath(connection.id);
  }

  updateConnections() {
    // Use requestAnimationFrame for smooth updates
    if (this.connectionUpdateQueued) return;

    this.connectionUpdateQueued = true;
    requestAnimationFrame(() => {
      this.connections.forEach((_, connectionId) => {
        this.updateConnectionPath(connectionId);
      });
      this.connectionUpdateQueued = false;
    });
    
    this.initializeSidebar(); 
    this.initContextMenu();   
  }

  updateConnectionPath(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const pathElement = document.querySelector(
      `[data-connection-id="${connectionId}"]`
    );
    if (!pathElement) return;

    const fromElement = document.querySelector(
      `[data-node-id="${connection.from.nodeId}"] [data-pin-id="${connection.from.pinId}"]`
    );
    const toElement = document.querySelector(
      `[data-node-id="${connection.to.nodeId}"] [data-pin-id="${connection.to.pinId}"]`
    );

    if (!fromElement || !toElement) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();

    const fromX =
      (fromRect.left + fromRect.width / 2 - canvasRect.left - this.panX) /
      this.scale;
    const fromY =
      (fromRect.top + fromRect.height / 2 - canvasRect.top - this.panY) /
      this.scale;
    const toX =
      (toRect.left + toRect.width / 2 - canvasRect.left - this.panX) /
      this.scale;
    const toY =
      (toRect.top + toRect.height / 2 - canvasRect.top - this.panY) /
      this.scale;

    const path = this.createConnectionPath(fromX, fromY, toX, toY);
    pathElement.setAttribute("d", path);
  }

  createConnectionPath(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const controlOffset = Math.max(50, dx * 0.5);

    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1} ${
      x2 - controlOffset
    } ${y2} ${x2} ${y2}`;
  }

  updateTransform() {
    this.nodesLayer.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
    );
    this.connectionsLayer.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
    );
  }

  addNode(type, name, x = 200, y = 200) {
    const nodeId = `node-${++this.nodeCounter}`;
    const template = this.nodeTemplates[name];

    if (!template) return;

    const node = {
      id: nodeId,
      type: type,
      name: name,
      position: {
        x: x + Math.random() * 100,
        y: y + Math.random() * 100,
      },
      pins: {
        inputs: template.pins.inputs.map((pin, i) => ({
          ...pin,
          local_id: `in-${i}`,
          global_id: `${nodeId}-in-${i}`,
        })),
        outputs: template.pins.outputs.map((pin, i) => ({
          ...pin,
          local_id: `out-${i}`,
          global_id: `${nodeId}-out-${i}`,
        })),
      },
      icon: template.icon,
    };

    this.nodes.set(nodeId, node);
    this.renderNode(node);
  }

  renderNode(node) {
    const nodeGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    nodeGroup.classList.add("node");
    nodeGroup.dataset.nodeId = node.id;

    const nodeWidth = 180;
    const nodeHeight =
      80 + Math.max(node.pins.inputs.length, node.pins.outputs.length) * 25;
    const headerHeight = 40;

    // Node background
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.classList.add("node-bg");
    bg.setAttribute("width", nodeWidth);
    bg.setAttribute("height", nodeHeight);
    nodeGroup.appendChild(bg);

    // Node header
    const header = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    header.classList.add("node-header");
    header.setAttribute("width", nodeWidth);
    header.setAttribute("height", headerHeight);
    header.setAttribute("fill", "url(#headerGradient)");
    nodeGroup.appendChild(header);

    // Node icon
    const iconGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    iconGroup.setAttribute("x", 12);
    iconGroup.setAttribute("y", headerHeight / 2 - 8);
    iconGroup.setAttribute("width", 16);
    iconGroup.setAttribute("height", 16);
    const iconDiv = document.createElement("div");
    iconDiv.innerHTML = `<i class="${node.icon}" style="color: var(--accent-color); font-size: 16px;"></i>`;
    iconGroup.appendChild(iconDiv);
    nodeGroup.appendChild(iconGroup);

    // Node title
    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    title.classList.add("node-title");
    title.setAttribute("x", 45);
    title.setAttribute("y", headerHeight / 2);
    title.textContent = node.name;
    nodeGroup.appendChild(title);

    // Input pins
    node.pins.inputs.forEach((pin, i) => {
      this.renderPin(nodeGroup, pin, i, "input", nodeHeight, headerHeight);
    });

    // Output pins
    node.pins.outputs.forEach((pin, i) => {
      this.renderPin(nodeGroup, pin, i, "output", nodeHeight, headerHeight);
    });

    nodeGroup.setAttribute(
      "transform",
      `translate(${node.position.x}, ${node.position.y})`
    );
    this.nodesLayer.appendChild(nodeGroup);
  }

  renderPin(nodeGroup, pin, index, type, nodeHeight, headerHeight) {
    const nodeWidth = 180;
    const pinY = headerHeight + 20 + index * 25;
    const pinX = type === "input" ? 0 : nodeWidth;

    const pinGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    pinGroup.classList.add("pin");

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.classList.add("pin-circle", `pin-${pin.data_type}`);
    circle.setAttribute("cx", pinX);
    circle.setAttribute("cy", pinY);
    circle.setAttribute("r", 6);
    circle.dataset.pinId = pin.local_id;
    circle.dataset.pinType = type;
    pinGroup.appendChild(circle);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.classList.add("pin-label", type);
    label.setAttribute("x", type === "input" ? pinX + 15 : pinX - 15);
    label.setAttribute("y", pinY);
    label.textContent = pin.name;
    pinGroup.appendChild(label);

    nodeGroup.appendChild(pinGroup);
  }

  updateNodePosition(nodeId) {
    const node = this.nodes.get(nodeId);
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);

    // Use transform for better performance
    nodeElement.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;

    // Update the SVG transform as backup
    nodeElement.setAttribute(
      "transform",
      `translate(${node.position.x}, ${node.position.y})`
    );
  }

  clear() {
    this.nodes.clear();
    this.connections.clear();
    this.nodesLayer.innerHTML = "";
    this.connectionsLayer.innerHTML = "";
    this.nodeCounter = 0;
    this.clearPinSelection();
  }
}

// Initialize the node editor
const editor = new NodeEditor();

// Global functions for toolbar
function addNode(type, name) {
  editor.addNode(type, name);
}

function clearCanvas() {
  editor.clear();
}

// Add some sample nodes
// editor.addNode("input", "Key Trigger", 100, 150);
// editor.addNode("logic", "Condition", 350, 150);
// editor.addNode("action", "Open App", 600, 100);
// editor.addNode("output", "Notification", 600, 250);
