// LogicEdit Core Implementation
class LogicEditor {
    constructor(container) {
        this.container = document.querySelector(container);
        this.canvas = document.querySelector('.canvas-layer');
        this.ctx = this.canvas.getContext('2d');
        this.hiddenInput = document.querySelector('.hidden-input');
        this.cursor = document.querySelector('.cursor');
        this.codeContent = document.querySelector('.code-content');
        
        // Editor state
        this.cursorPos = { line: 0, col: 0 };
        this.selection = null;
        this.isComposing = false;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.startAnimations();
        console.log('🚀 LogicEdit initialized with modern UI!');
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    setupEventListeners() {
        // Focus management
        this.container.addEventListener('click', (e) => {
            this.hiddenInput.focus();
            this.updateCursorFromClick(e);
        });

        // Input handling
        this.hiddenInput.addEventListener('input', (e) => {
            if (!this.isComposing) {
                this.handleTextInput(e);
            }
        });

        // Keyboard shortcuts
        this.hiddenInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Composition events (for IME)
        this.hiddenInput.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });

        this.hiddenInput.addEventListener('compositionend', (e) => {
            this.isComposing = false;
            this.handleTextInput(e);
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.textContent.trim();
                this.handleToolbarAction(action);
            });
        });

        // Status bar interactions
        document.querySelectorAll('.status-item').forEach(item => {
            item.addEventListener('click', (e) => {
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 100);
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    updateCursorFromClick(e) {
        const rect = this.codeContent.getBoundingClientRect();
        const x = e.clientX - rect.left - 20; // account for padding
        const y = e.clientY - rect.top - 20;
        
        const lineHeight = 24;
        const charWidth = 8.4; // approximate monospace width
        
        const line = Math.floor(y / lineHeight);
        const col = Math.floor(x / charWidth);
        
        this.setCursorPosition(line, Math.max(0, col));
    }

    setCursorPosition(line, col) {
        this.cursorPos = { line: Math.max(0, line), col: Math.max(0, col) };
        
        // Update visual cursor
        const x = col * 8.4;
        const y = line * 24;
        this.cursor.style.left = x + 'px';
        this.cursor.style.top = y + 'px';
        
        // Update line number highlighting
        document.querySelectorAll('.line-number').forEach((el, i) => {
            el.classList.toggle('active', i === line);
        });
        
        // Update status bar
        const statusPos = document.querySelector('.status-item:nth-child(2)');
        statusPos.textContent = `📍 Ln ${line + 1}, Col ${col + 1}`;
    }

    handleTextInput(e) {
        // This would integrate with the text model
        console.log('Text input:', e.data || e.target.value);
        // Update syntax highlighting, cursor position, etc.
    }

    handleKeydown(e) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.setCursorPosition(this.cursorPos.line, this.cursorPos.col - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.setCursorPosition(this.cursorPos.line, this.cursorPos.col + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setCursorPosition(this.cursorPos.line - 1, this.cursorPos.col);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setCursorPosition(this.cursorPos.line + 1, this.cursorPos.col);
                break;
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.saveFile();
                }
                break;
        }
    }

    handleToolbarAction(action) {
        switch(action) {
            case '💾 Save':
                this.saveFile();
                break;
            case '⚙️ Settings':
                console.log('Opening settings...');
                break;
            case '🎨 Theme':
                this.toggleTheme();
                break;
        }
    }

    saveFile() {
        // Simulate save with animation
        const saveBtn = document.querySelector('.toolbar-btn[title="Save"]');
        const statusSave = document.querySelector('.status-item:last-child');
        
        statusSave.textContent = '💾 Saving...';
        statusSave.style.color = '#f59e0b';
        
        setTimeout(() => {
            statusSave.textContent = '💾 Saved';
            statusSave.style.color = '#10b981';
            
            setTimeout(() => {
                statusSave.style.color = '';
            }, 2000);
        }, 500);
    }

    toggleTheme() {
        // Simple theme toggle demo
        const body = document.body;
        const currentBg = body.style.background;
        
        if (currentBg.includes('0a0e1a')) {
            body.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)';
        } else {
            body.style.background = 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0f172a 100%)';
        }
    }

    startAnimations() {
        // Animate minimap viewport
        const viewport = document.querySelector('.minimap-viewport');
        let direction = 1;
        let position = 10;
        
        setInterval(() => {
            position += direction * 0.5;
            if (position > 150 || position < 10) direction *= -1;
            viewport.style.top = position + 'px';
        }, 100);

        // Animate status dot
        const dots = document.querySelectorAll('.status-dot');
        dots.forEach(dot => {
            setInterval(() => {
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
                dot.style.background = colors[Math.floor(Math.random() * colors.length)];
            }, 3000);
        });
    }
}

// Initialize the editor
document.addEventListener('DOMContentLoaded', () => {
    new LogicEditor('.editor-container');
});