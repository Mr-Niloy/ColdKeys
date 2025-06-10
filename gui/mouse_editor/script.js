class CurveEditor {
    constructor() {
        this.canvas = document.getElementById('curveCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.playbackCursor = document.getElementById('playbackCursor');
        this.clickRipple = document.getElementById('clickRipple');
        this.playbackMarker = document.getElementById('playbackMarker');
        
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 4.5;
        this.activeSegment = 0;
        this.playbackSpeed = 1;
        
        this.timelineZoom = 1;
    this.timelinePan = 0;
    this.mouseButtonColors = {
        'left': '#ff4444',
        'right': '#8844ff', 
        'middle': '#ffaa00',
        'click': '#ff4444',
        'rightclick': '#8844ff',
        'middleclick': '#ffaa00'
    };

        // Sample curve data with mouse movements
        this.curves = [
            {
                id: 0,
                type: 'click',
                startTime: 0.0,
                endTime: 0.2,
                points: [{ x: 100, y: 150, time: 0.0 }, { x: 100, y: 150, time: 0.2 }],
                events: [{ type: 'click', x: 100, y: 150, time: 0.1 }]
            },
            {
                id: 1,
                type: 'drag',
                startTime: 0.2,
                endTime: 1.5,
                points: this.generateCurvePoints(this.canvas, 100, 150, 300, 200, 1.3),
                events: [
                    { type: 'mousedown', x: 100, y: 150, time: 0.2 },
                    { type: 'mouseup', x: 300, y: 200, time: 1.5 }
                ]
            },
            {
                id: 2,
                type: 'move',
                startTime: 1.5,
                endTime: 2.8,
                points: this.generateCurvePoints(this.canvas, 300, 200, 500, 100, 1.3),
                events: []
            },
            {
                id: 3,
                type: 'right-click',
                startTime: 2.8,
                endTime: 3.0,
                points: [{ x: 500, y: 100, time: 2.8 }, { x: 500, y: 100, time: 3.0 }],
                events: [{ type: 'rightclick', x: 500, y: 100, time: 2.9 }]
            },
            {
                id: 4,
                type: 'click-drag',
                startTime: 3.0,
                endTime: 4.5,
                points: this.generateCurvePoints(this.canvas, 500, 100, 200, 400, 1.5),
                events: [
                    { type: 'click', x: 500, y: 100, time: 3.0 },
                    { type: 'mousedown', x: 500, y: 100, time: 3.1 },
                    { type: 'mouseup', x: 200, y: 400, time: 4.4 }
                ]
            }
        ];
        
        this.init();
    }
    
    generateCurvePoints(curves, startX, startY, endX, endY, duration) {
        const points = [];
        const steps = Math.floor(duration * 60); // 60 FPS
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const easeT = this.easeInOutCubic(t);
            
            // Add some curve variation
            const controlX = (startX + endX) / 2 + Math.sin(t * Math.PI) * 50;
            const controlY = (startY + endY) / 2 + Math.cos(t * Math.PI * 2) * 30;
            
            const x = this.bezierInterpolate(startX, controlX, endX, easeT);
            const y = this.bezierInterpolate(startY, controlY, endY, easeT);
            
            const time = (t * duration) + (curves.length > 0 ? curves[curves.length - 1].endTime || 0 : 0);
            
            points.push({ x, y, time });
        }
        
        return points;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    bezierInterpolate(start, control, end, t) {
        return Math.pow(1 - t, 2) * start + 2 * (1 - t) * t * control + Math.pow(t, 2) * end;
    }
    
init() {
    this.setupCanvas();
    this.setupTimeline();
    this.bindEvents();
    this.render();
    this.updateUI();
}

    // Add timeline methods
setupTimeline() {
    this.generateTimeMarkers();
    this.bindTimelineEvents();
}
generateTimeMarkers() {
    const markersContainer = document.getElementById('timeMarkers');
    markersContainer.innerHTML = '';
    
    const step = 0.5; // Every 0.5 seconds
    for (let time = 0; time <= this.totalTime; time += step) {
        const marker = document.createElement('div');
        marker.className = 'time-number';
        marker.textContent = time.toFixed(1);
        marker.style.left = `${(time / this.totalTime) * 100}%`;
        markersContainer.appendChild(marker);
    }
}

bindTimelineEvents() {
    const track = document.getElementById('timelineTrack');
    let isPanning = false;
    let startX = 0;
    let startPan = 0;

    // Pan functionality
    track.addEventListener('mousedown', (e) => {
        isPanning = true;
        startX = e.clientX;
        startPan = this.timelinePan;
        track.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const deltaX = e.clientX - startX;
            this.timelinePan = startPan + deltaX;
            this.updateTimelineTransform();
        }
    });

    document.addEventListener('mouseup', () => {
        isPanning = false;
        track.style.cursor = 'grab';
    });

    // Zoom with scroll
    track.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.timelineZoom = Math.max(0.5, Math.min(5, this.timelineZoom * zoomFactor));
        this.updateTimelineTransform();
    });
}

updateTimelineTransform() {
    const content = document.getElementById('timelineContent');
    content.style.transform = `translateX(${this.timelinePan}px) scaleX(${this.timelineZoom})`;
    content.style.width = `${100 * this.timelineZoom}%`;
}

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    bindEvents() {
        // Segment selection
        document.querySelectorAll('.segment-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.segment-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.activeSegment = parseInt(item.dataset.segment);
                this.render();
                this.updateUI();
            });
        });
        
        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        
        // Timeline interaction
        const timelineTrack = document.getElementById('timelineTrack');
        timelineTrack.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            this.currentTime = percentage * this.totalTime;
            this.updatePlaybackPosition();
        });
        
        // Tool toggles
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.classList.toggle('active');
                this.render();
            });
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    }
    
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'flex';
        document.getElementById('pauseBtn').classList.add('active');
        
        this.playbackCursor.classList.add('active');
        
        this.playbackLoop();
    }
    
    pause() {
        this.isPlaying = false;
        document.getElementById('playBtn').style.display = 'flex';
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('pauseBtn').classList.remove('active');
        
        this.playbackCursor.classList.remove('active');
    }
    
    playbackLoop() {
        if (!this.isPlaying) return;
        
        this.currentTime += 0.016 * this.playbackSpeed; // ~60 FPS
        
        if (this.currentTime >= this.totalTime) {
            this.currentTime = 0;
        }
        
        this.updatePlaybackPosition();
        this.animatePlayback();
        
        requestAnimationFrame(() => this.playbackLoop());
    }
    
    updatePlaybackPosition() {
        const percentage = (this.currentTime / this.totalTime) * 100;
        this.playbackMarker.style.left = `${percentage}%`;
        
        document.getElementById('currentTime').textContent = this.currentTime.toFixed(1);
        
        // Update active segment based on current time
        for (let i = 0; i < this.curves.length; i++) {
            const curve = this.curves[i];
            if (this.currentTime >= curve.startTime && this.currentTime <= curve.endTime) {
                if (this.activeSegment !== i) {
                    this.activeSegment = i;
                    this.updateActiveSegment();
                }
                break;
            }
        }
    }
    
    updateActiveSegment() {
        document.querySelectorAll('.segment-item').forEach((item, index) => {
            if (index === this.activeSegment) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        this.updateUI();
    }
    
    animatePlayback() {
        const activeCurve = this.curves[this.activeSegment];
        if (!activeCurve) return;
        
        // Find current position on the curve
        const curveProgress = (this.currentTime - activeCurve.startTime) / (activeCurve.endTime - activeCurve.startTime);
        
        if (curveProgress >= 0 && curveProgress <= 1) {
            const pointIndex = Math.floor(curveProgress * (activeCurve.points.length - 1));
            const point = activeCurve.points[pointIndex];
            
            if (point) {
                // Update cursor position
                const rect = this.canvas.getBoundingClientRect();
                this.playbackCursor.style.left = `${point.x}px`;
                this.playbackCursor.style.top = `${point.y}px`;
                
                // Check for events at current time
                activeCurve.events.forEach(event => {
                    if (Math.abs(event.time - this.currentTime) < 0.05) {
                        this.triggerClickRipple(event.x, event.y);
                    }
                });
            }
        }
    }
    
    triggerClickRipple(x, y) {
        this.clickRipple.style.left = `${x}px`;
        this.clickRipple.style.top = `${y}px`;
        this.clickRipple.classList.remove('animate');
        
        // Force reflow
        this.clickRipple.offsetHeight;
        
        this.clickRipple.classList.add('animate');
        
        setTimeout(() => {
            this.clickRipple.classList.remove('animate');
        }, 600);
    }
    

    
    render() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw grid if enabled
        if (document.querySelector('[data-option="grid"]').classList.contains('active')) {
            this.drawGrid();
        }
        
        // Draw all curves
        this.curves.forEach((curve, index) => {
            const isActive = index === this.activeSegment;
            const opacity = isActive ? 1 : 0.3;
            this.drawCurve(curve, opacity, isActive);
        });
        
        // Draw clicks if enabled
        if (document.querySelector('[data-option="clicks"]').classList.contains('active')) {
            this.drawClickMarkers();
        }
    }
    
    drawGrid() {
        const rect = this.canvas.getBoundingClientRect();
        const gridSize = 20;
        
        this.ctx.strokeStyle = 'rgba(42, 42, 53, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < rect.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, rect.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < rect.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(rect.width, y);
            this.ctx.stroke();
        }
    }
    
    drawCurve(curve, opacity, isActive) {
        if (curve.points.length < 2) return;
        
        const colors = {
            click: '#ff4444',
            drag: '#ff6b35',
            move: '#00ff88',
            'right-click': '#8844ff',
            'click-drag': '#ff6b35'
        };
        
        // Create gradient from start to end
        const startPoint = curve.points[0];
        const endPoint = curve.points[curve.points.length - 1];
        
        const gradient = this.ctx.createLinearGradient(
            startPoint.x, startPoint.y,
            endPoint.x, endPoint.y
        );

            // Calculate time-based opacity
    const timeProgress = Math.min(1, this.currentTime / this.totalTime);
    const curveTimeProgress = (curve.startTime + curve.endTime) / 2 / this.totalTime;
    const timeOpacity = 0.2 + (0.8 * Math.min(1, timeProgress / Math.max(0.1, curveTimeProgress)));
    
    const finalOpacity = isActive ? 1 : Math.min(opacity, timeOpacity);

        
        gradient.addColorStop(0, `rgba(0, 255, 136, ${finalOpacity})`); // Green start
        gradient.addColorStop(1, `rgba(68, 132, 255, ${finalOpacity})`); // Blue end
        
        // Draw curve path
        this.ctx.strokeStyle = isActive ? colors[curve.type] || gradient : gradient;
        this.ctx.lineWidth = isActive ? 3 : 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(curve.points[0].x, curve.points[0].y);
        
        // Draw smooth curve using quadratic curves
        for (let i = 1; i < curve.points.length - 1; i++) {
            const currentPoint = curve.points[i];
            const nextPoint = curve.points[i + 1];
            const midX = (currentPoint.x + nextPoint.x) / 2;
            const midY = (currentPoint.y + nextPoint.y) / 2;
            
            this.ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midX, midY);
        }
        
        // Draw to last point
        const lastPoint = curve.points[curve.points.length - 1];
        this.ctx.lineTo(lastPoint.x, lastPoint.y);
        this.ctx.stroke();
        
        // Draw control points for active curve
        if (isActive) {
            this.drawControlPoints(curve);
        }
        
        // Draw start and end markers
        this.drawStartEndMarkers(curve, opacity);
    }
    
    drawControlPoints(curve) {
        this.ctx.fillStyle = 'rgba(255, 107, 53, 0.8)';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // Draw every 10th point to avoid clutter
        for (let i = 0; i < curve.points.length; i += 10) {
            const point = curve.points[i];
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
    
    drawStartEndMarkers(curve, opacity) {
        const startPoint = curve.points[0];
        const endPoint = curve.points[curve.points.length - 1];
        
        // Start marker (green)
        this.ctx.fillStyle = `rgba(0, 255, 136, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(startPoint.x, startPoint.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // End marker (blue)
        this.ctx.fillStyle = `rgba(68, 132, 255, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
drawClickMarkers() {
    this.curves.forEach(curve => {
        curve.events.forEach(event => {
            if (event.type.includes('click') || event.type === 'mousedown') {
                const color = this.mouseButtonColors[event.button] || this.mouseButtonColors[event.type] || '#ff4444';
                
                this.ctx.fillStyle = color;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(event.x, event.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
        });
    });
}
    
updateUI() {
    const activeCurve = this.curves[this.activeSegment];
    if (!activeCurve) return;
    
    const duration = (activeCurve.endTime - activeCurve.startTime).toFixed(1);
    const distance = this.calculateCurveDistance(activeCurve);
    const points = activeCurve.points.length;
    const type = this.formatCurveType(activeCurve.type);
    
    const statValues = document.querySelectorAll('.stat-value');
    statValues[0].textContent = `${duration}s`;
    statValues[1].textContent = `${distance}px`;
    statValues[2].textContent = points;
    statValues[3].textContent = type;
}

    
    calculateCurveDistance(curve) {
        let totalDistance = 0;
        for (let i = 1; i < curve.points.length; i++) {
            const prev = curve.points[i - 1];
            const curr = curve.points[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        return Math.round(totalDistance);
    }
    
    formatCurveType(type) {
        const typeMap = {
            'click': 'Mouse Click',
            'drag': 'Drag Motion',
            'move': 'Free Move',
            'right-click': 'Right Click',
            'click-drag': 'Click & Drag'
        };
        return typeMap[type] || type;
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurveEditor();
});