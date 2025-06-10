class CurveEditor {
    constructor() {
        this.canvas = document.getElementById('curveCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.playbackCursor = document.getElementById('playbackCursor');
        this.clickAnimations = document.getElementById('clickAnimations');
        
        // Playback state
        this.isPlaying = false;
        this.currentTime = 0;
        this.totalTime = 12.5; // seconds
        this.playbackSpeed = 1;
        this.animationId = null;
        
        // Sample curve data
        this.curves = this.generateSampleCurves();
        this.selectedCurve = 0;
        
        // Additional state for editing
        this.isDragging = false;
        this.draggedElement = null;
        this.editMode = 'bezier'; // 'bezier', 'raw', 'draw'
        this.hoveredElement = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.populateSegments();
        this.setupEventListeners();
        this.setupTimeMarkers();
        this.render();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = 800 * dpr;
        this.canvas.height = 600 * dpr;
        this.canvas.style.width = '800px';
        this.canvas.style.height = '600px';
        
        this.ctx.scale(dpr, dpr);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    generateSampleCurves() {
        const curves = [];
        
        // Generate 5 different realistic mouse movement segments
        for (let i = 0; i < 5; i++) {
            const startTime = i * 2.5;
            const endTime = (i + 1) * 2.5;
            const points = [];
            
            // Start from a random position
            let currentX = 100 + Math.random() * 600;
            let currentY = 100 + Math.random() * 400;
            
            // Target position for this segment
            const targetX = 100 + Math.random() * 600;
            const targetY = 100 + Math.random() * 400;
            
            // Generate realistic mouse movement
            const numPoints = 15 + Math.random() * 20;
            let velocity = { x: 0, y: 0 };
            
            for (let j = 0; j < numPoints; j++) {
                const t = j / (numPoints - 1);
                
                // Calculate desired direction to target
                const dx = targetX - currentX;
                const dy = targetY - currentY;
                const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
                
                if (distanceToTarget > 5) {
                    // Apply acceleration towards target
                    const acceleration = 0.3;
                    const desiredVelX = (dx / distanceToTarget) * Math.min(distanceToTarget * 0.1, 15);
                    const desiredVelY = (dy / distanceToTarget) * Math.min(distanceToTarget * 0.1, 15);
                    
                    velocity.x += (desiredVelX - velocity.x) * acceleration;
                    velocity.y += (desiredVelY - velocity.y) * acceleration;
                }
                
                // Add some natural jitter and overshoot
                const jitterX = (Math.random() - 0.5) * 3;
                const jitterY = (Math.random() - 0.5) * 3;
                
                // Apply velocity with damping
                velocity.x *= 0.95;
                velocity.y *= 0.95;
                
                currentX += velocity.x + jitterX;
                currentY += velocity.y + jitterY;
                
                // Add slight arc/curve tendency
                if (j > 0 && j < numPoints - 1) {
                    const arcInfluence = Math.sin(t * Math.PI) * 20;
                    const perpX = -velocity.y / Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) || 0;
                    const perpY = velocity.x / Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) || 0;
                    
                    currentX += perpX * arcInfluence * (Math.random() - 0.5);
                    currentY += perpY * arcInfluence * (Math.random() - 0.5);
                }
                
                points.push({
                    x: Math.max(50, Math.min(750, currentX)),
                    y: Math.max(50, Math.min(550, currentY)),
                    time: startTime + t * (endTime - startTime),
                    isControlPoint: j % 4 === 0 // Mark every 4th point as a control point
                });
            }
            
            // Add some clicks at natural positions
            const clicks = [];
            if (Math.random() > 0.4) {
                const clickIndex = Math.floor(points.length * (0.7 + Math.random() * 0.2));
                clicks.push({
                    x: points[clickIndex].x,
                    y: points[clickIndex].y,
                    time: points[clickIndex].time,
                    button: 'left'
                });
            }
            if (Math.random() > 0.8) {
                const clickIndex = Math.floor(points.length * (0.2 + Math.random() * 0.3));
                clicks.push({
                    x: points[clickIndex].x,
                    y: points[clickIndex].y,
                    time: points[clickIndex].time,
                    button: 'right'
                });
            }
            
            curves.push({
                id: i,
                startTime,
                endTime,
                points,
                clicks,
                type: ['move', 'click', 'drag', 'scroll'][Math.floor(Math.random() * 4)],
                opacity: 1 - (i * 0.1), // Fade older curves
                bezierHandles: this.generateBezierHandles(points)
            });
        }
        
        return curves;
    }
    
    populateSegments() {
        const segmentList = document.getElementById('segmentList');
        segmentList.innerHTML = '';
        
        this.curves.forEach((curve, index) => {
            const segmentItem = document.createElement('div');
            segmentItem.className = `segment-item ${index === this.selectedCurve ? 'active' : ''}`;
            segmentItem.dataset.index = index;
            
            const duration = (curve.endTime - curve.startTime).toFixed(1);
            
            segmentItem.innerHTML = `
                <div class="segment-icon ${curve.type}"></div>
                <div class="segment-info">
                    <div class="segment-title">Segment ${index + 1}</div>
                    <div class="segment-meta">${duration}s • ${curve.points.length} points</div>
                </div>
            `;
            
            segmentItem.addEventListener('click', () => {
                this.selectSegment(index);
            });
            
            segmentList.appendChild(segmentItem);
        });
    }
    
    selectSegment(index) {
        this.selectedCurve = index;
        this.populateSegments();
        this.render();
    }
    
    setupEventListeners() {
        // Playback controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // Speed control
        const speedSelect = document.getElementById('playbackSpeed');
        speedSelect.addEventListener('change', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
        });
        
        // Timeline interaction
        const timelineTrack = document.querySelector('.timeline-track');
        timelineTrack.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const progress = x / rect.width;
            this.currentTime = progress * this.totalTime;
            this.updateTimeDisplay();
            this.render();
        });
        
        // Timeline dragging
        const timelineHandle = document.getElementById('timelineHandle');
        let isDragging = false;
        
        timelineHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.pause();
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = timelineTrack.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const progress = Math.max(0, Math.min(1, x / rect.width));
            this.currentTime = progress * this.totalTime;
            this.updateTimeDisplay();
            this.render();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Tool panel controls
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.editMode = btn.dataset.mode;
                this.render();
            });
        });
        
        // Canvas interaction for editing
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseDown(x, y, e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseMove(x, y, e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    generateBezierHandles(points) {
        const handles = [];
        
        for (let i = 0; i < points.length; i++) {
            if (!points[i].isControlPoint) continue;
            
            const current = points[i];
            const prev = points[Math.max(0, i - 1)];
            const next = points[Math.min(points.length - 1, i + 1)];
            
            // Calculate handle directions based on adjacent points
            const prevDir = { x: current.x - prev.x, y: current.y - prev.y };
            const nextDir = { x: next.x - current.x, y: next.y - current.y };
            
            // Average direction for smooth curve
            const avgDir = {
                x: (prevDir.x + nextDir.x) * 0.3,
                y: (prevDir.y + nextDir.y) * 0.3
            };
            
            handles.push({
                pointIndex: i,
                handle1: { x: current.x - avgDir.x, y: current.y - avgDir.y },
                handle2: { x: current.x + avgDir.x, y: current.y + avgDir.y }
            });
        }
        
        return handles;
    }
    
    handleMouseDown(x, y, event) {
        if (this.isPlaying) return;
        
        const selectedCurve = this.curves[this.selectedCurve];
        if (!selectedCurve) return;
        
        // Check for handle dragging in Bezier mode
        if (this.editMode === 'bezier') {
            const handle = this.getHandleAt(x, y, selectedCurve);
            if (handle) {
                this.isDragging = true;
                this.draggedElement = handle;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }
        
        // Check for point dragging
        const point = this.getPointAt(x, y, selectedCurve);
        if (point) {
            this.isDragging = true;
            this.draggedElement = { type: 'point', ...point };
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        // Add new point if in draw mode
        if (this.editMode === 'draw') {
            this.addPointToPath(x, y, selectedCurve);
        }
    }
    
    handleMouseMove(x, y, event) {
        if (this.isDragging && this.draggedElement) {
            this.updateDraggedElement(x, y);
            this.render();
            return;
        }
        
        // Update hover state
        const selectedCurve = this.curves[this.selectedCurve];
        if (!selectedCurve) return;
        
        let newHovered = null;
        
        if (this.editMode === 'bezier') {
            newHovered = this.getHandleAt(x, y, selectedCurve) || this.getPointAt(x, y, selectedCurve);
        } else {
            newHovered = this.getPointAt(x, y, selectedCurve);
        }
        
        if (newHovered !== this.hoveredElement) {
            this.hoveredElement = newHovered;
            this.canvas.style.cursor = newHovered ? 'grab' : 'default';
            this.render();
        }
    }
    
    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedElement = null;
            this.canvas.style.cursor = this.hoveredElement ? 'grab' : 'default';
        }
    }
    
    getPointAt(x, y, curve) {
        const threshold = 8;
        
        for (let i = 0; i < curve.points.length; i++) {
            const point = curve.points[i];
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            
            if (distance <= threshold) {
                return { type: 'point', index: i, point: point };
            }
        }
        return null;
    }
    
    getHandleAt(x, y, curve) {
        if (!curve.bezierHandles) return null;
        
        const threshold = 6;
        
        for (let handle of curve.bezierHandles) {
            // Check handle1
            const dist1 = Math.sqrt((x - handle.handle1.x) ** 2 + (y - handle.handle1.y) ** 2);
            if (dist1 <= threshold) {
                return { type: 'handle1', handle: handle };
            }
            
            // Check handle2
            const dist2 = Math.sqrt((x - handle.handle2.x) ** 2 + (y - handle.handle2.y) ** 2);
            if (dist2 <= threshold) {
                return { type: 'handle2', handle: handle };
            }
        }
        return null;
    }
    
    updateDraggedElement(x, y) {
        const element = this.draggedElement;
        
        if (element.type === 'point') {
            const curve = this.curves[this.selectedCurve];
            curve.points[element.index].x = x;
            curve.points[element.index].y = y;
            
            // Update bezier handles for this point if it's a control point
            this.updateBezierHandlesForPoint(curve, element.index);
            
        } else if (element.type === 'handle1' || element.type === 'handle2') {
            element.handle[element.type].x = x;
            element.handle[element.type].y = y;
        }
    }
    
    updateBezierHandlesForPoint(curve, pointIndex) {
        if (!curve.bezierHandles) return;
        
        const handle = curve.bezierHandles.find(h => h.pointIndex === pointIndex);
        if (!handle) return;
        
        const point = curve.points[pointIndex];
        const prev = curve.points[Math.max(0, pointIndex - 1)];
        const next = curve.points[Math.min(curve.points.length - 1, pointIndex + 1)];
        
        // Recalculate handle positions
        const prevDir = { x: point.x - prev.x, y: point.y - prev.y };
        const nextDir = { x: next.x - point.x, y: next.y - point.y };
        const avgDir = {
            x: (prevDir.x + nextDir.x) * 0.3,
            y: (prevDir.y + nextDir.y) * 0.3
        };
        
        handle.handle1 = { x: point.x - avgDir.x, y: point.y - avgDir.y };
        handle.handle2 = { x: point.x + avgDir.x, y: point.y + avgDir.y };
    }
    
    addPointToPath(x, y, curve) {
        // Find the best insertion point
        let insertIndex = curve.points.length;
        let minDistance = Infinity;
        
        for (let i = 0; i < curve.points.length - 1; i++) {
            const p1 = curve.points[i];
            const p2 = curve.points[i + 1];
            const distance = this.pointToLineDistance({ x, y }, p1, p2);
            
            if (distance < minDistance) {
                minDistance = distance;
                insertIndex = i + 1;
            }
        }
        
        // Calculate time for new point
        const prevTime = insertIndex > 0 ? curve.points[insertIndex - 1].time : curve.startTime;
        const nextTime = insertIndex < curve.points.length ? curve.points[insertIndex].time : curve.endTime;
        const newTime = (prevTime + nextTime) / 2;
        
        const newPoint = {
            x: x,
            y: y,
            time: newTime,
            isControlPoint: true
        };
        
        curve.points.splice(insertIndex, 0, newPoint);
        
        // Regenerate bezier handles
        curve.bezierHandles = this.generateBezierHandles(curve.points);
        
        this.render();
    }
    
    setupTimeMarkers() {
        const timeMarkers = document.getElementById('timeMarkers');
        timeMarkers.innerHTML = '';
        
        // Add time markers every second
        for (let i = 0; i <= this.totalTime; i++) {
            const marker = document.createElement('div');
            marker.className = `time-marker ${i % 5 === 0 ? 'major' : ''}`;
            marker.style.left = `${(i / this.totalTime) * 100}%`;
            timeMarkers.appendChild(marker);
        }
    }
    
    togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.isPlaying = true;
        document.getElementById('playPauseBtn').innerHTML = '<span class="control-icon">⏸️</span>';
        this.playbackCursor.classList.add('active');
        
        const startTime = performance.now();
        const initialTime = this.currentTime;
        
        const animate = (currentTimestamp) => {
            if (!this.isPlaying) return;
            
            const elapsed = (currentTimestamp - startTime) / 1000 * this.playbackSpeed;
            this.currentTime = initialTime + elapsed;
            
            if (this.currentTime >= this.totalTime) {
                this.currentTime = this.totalTime;
                this.pause();
                return;
            }
            
            this.updateTimeDisplay();
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    pause() {
        this.isPlaying = false;
        document.getElementById('playPauseBtn').innerHTML = '<span class="control-icon">▶️</span>';
        this.playbackCursor.classList.remove('active');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    updateTimeDisplay() {
        document.getElementById('currentTime').textContent = this.currentTime.toFixed(1) + 's';
        document.getElementById('totalTime').textContent = this.totalTime.toFixed(1) + 's';
        
        // Update timeline progress
        const progress = (this.currentTime / this.totalTime) * 100;
        document.getElementById('timelineProgress').style.width = `${progress}%`;
        document.getElementById('timelineHandle').style.left = `${progress}%`;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw all curves
        this.curves.forEach((curve, index) => {
            this.drawCurve(curve, index === this.selectedCurve);
        });
        
        // Draw playback cursor position
        this.updatePlaybackCursor();
        
        // Check for clicks during playback
        this.checkForClicks();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= 800; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 600);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= 600; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(800, y);
            this.ctx.stroke();
        }
    }
    
    drawCurve(curve, isSelected) {
        if (curve.points.length < 2) return;
        
        const opacity = isSelected ? 1 : curve.opacity;
        
        // Draw curve path with gradient
        const gradient = this.ctx.createLinearGradient(
            curve.points[0].x, curve.points[0].y,
            curve.points[curve.points.length - 1].x, curve.points[curve.points.length - 1].y
        );
        gradient.addColorStop(0, `rgba(74, 222, 128, ${opacity})`); // Green start
        gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity})`); // Blue end
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.shadowColor = isSelected ? 'rgba(255, 107, 53, 0.5)' : 'transparent';
        this.ctx.shadowBlur = isSelected ? 10 : 0;
        
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
        
        // Final point
        const lastPoint = curve.points[curve.points.length - 1];
        this.ctx.lineTo(lastPoint.x, lastPoint.y);
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw start and end markers
        this.drawMarker(curve.points[0].x, curve.points[0].y, '#4ade80', opacity, 'start');
        this.drawMarker(lastPoint.x, lastPoint.y, '#3b82f6', opacity, 'end');
        
        // Draw control points if selected
        if (isSelected) {
            this.drawControlPoints(curve);
        }
        
        // Draw click markers
        this.drawClickMarkers(curve, opacity);
    }
    
    drawMarker(x, y, color, opacity, type) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // Outer ring
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner dot
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add arrow for direction
        if (type === 'end') {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 3, y - 3);
            this.ctx.lineTo(x + 3, y);
            this.ctx.lineTo(x - 3, y + 3);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawControlPoints(curve) {
        if (this.editMode === 'raw') {
            // Show all points in raw mode
            curve.points.forEach((point, index) => {
                const isHovered = this.hoveredElement && this.hoveredElement.type === 'point' && this.hoveredElement.index === index;
                
                this.ctx.fillStyle = isHovered ? 'rgba(255, 107, 53, 1)' : 'rgba(255, 107, 53, 0.8)';
                this.ctx.strokeStyle = 'rgba(255, 107, 53, 1)';
                this.ctx.lineWidth = 1;
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, isHovered ? 4 : 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            });
        } else if (this.editMode === 'bezier') {
            // Show control points and handles
            curve.points.forEach((point, index) => {
                if (!point.isControlPoint) return;
                
                const isHovered = this.hoveredElement && this.hoveredElement.type === 'point' && this.hoveredElement.index === index;
                
                this.ctx.fillStyle = isHovered ? 'rgba(255, 107, 53, 1)' : 'rgba(255, 107, 53, 0.8)';
                this.ctx.strokeStyle = 'rgba(255, 107, 53, 1)';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, isHovered ? 6 : 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            });
            
            // Draw bezier handles
            this.drawBezierHandles(curve);
        }
    }
    
    drawBezierHandles(curve) {
        if (!curve.bezierHandles) return;
        
        curve.bezierHandles.forEach(handle => {
            const point = curve.points[handle.pointIndex];
            
            // Draw handle lines
            this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([3, 3]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(handle.handle1.x, handle.handle1.y);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(handle.handle2.x, handle.handle2.y);
            this.ctx.stroke();
            
            this.ctx.setLineDash([]);
            
            // Draw handle points
            const isHandle1Hovered = this.hoveredElement && this.hoveredElement.type === 'handle1' && this.hoveredElement.handle === handle;
            const isHandle2Hovered = this.hoveredElement && this.hoveredElement.type === 'handle2' && this.hoveredElement.handle === handle;
            
            // Handle 1
            this.ctx.fillStyle = isHandle1Hovered ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.8)';
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            this.ctx.arc(handle.handle1.x, handle.handle1.y, isHandle1Hovered ? 4 : 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Handle 2
            this.ctx.fillStyle = isHandle2Hovered ? 'rgba(139, 92, 246, 1)' : 'rgba(139, 92, 246, 0.8)';
            this.ctx.strokeStyle = 'rgba(139, 92, 246, 1)';
            
            this.ctx.beginPath();
            this.ctx.arc(handle.handle2.x, handle.handle2.y, isHandle2Hovered ? 4 : 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }
    
    drawClickMarkers(curve, opacity) {
        if (!document.getElementById('showClicks').checked) return;
        
        curve.clicks.forEach(click => {
            const color = click.button === 'left' ? '#ef4444' : 
                         click.button === 'right' ? '#f59e0b' : '#8b5cf6';
            
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            
            // Click ring
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(click.x, click.y, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Inner cross
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(click.x - 4, click.y - 4);
            this.ctx.lineTo(click.x + 4, click.y + 4);
            this.ctx.moveTo(click.x + 4, click.y - 4);
            this.ctx.lineTo(click.x - 4, click.y + 4);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    updatePlaybackCursor() {
        if (!this.isPlaying && this.currentTime === 0) return;
        
        // Find current position based on time
        const currentPosition = this.getCurrentPosition();
        if (!currentPosition) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        
        // Position cursor relative to canvas container
        const offsetX = (canvasRect.left - containerRect.left) + currentPosition.x;
        const offsetY = (canvasRect.top - containerRect.top) + currentPosition.y;
        
        this.playbackCursor.style.left = `${offsetX - 8}px`;
        this.playbackCursor.style.top = `${offsetY - 8}px`;
        
        if (this.currentTime > 0) {
            this.playbackCursor.classList.add('active');
        }
    }
    
    getCurrentPosition() {
        // Find which curve and position we're currently at
        for (let curve of this.curves) {
            if (this.currentTime >= curve.startTime && this.currentTime <= curve.endTime) {
                const curveProgress = (this.currentTime - curve.startTime) / (curve.endTime - curve.startTime);
                const pointIndex = Math.floor(curveProgress * (curve.points.length - 1));
                const nextIndex = Math.min(pointIndex + 1, curve.points.length - 1);
                
                if (pointIndex === nextIndex) {
                    return curve.points[pointIndex];
                }
                
                // Interpolate between points
                const localProgress = (curveProgress * (curve.points.length - 1)) - pointIndex;
                const currentPoint = curve.points[pointIndex];
                const nextPoint = curve.points[nextIndex];
                
                return {
                    x: currentPoint.x + (nextPoint.x - currentPoint.x) * localProgress,
                    y: currentPoint.y + (nextPoint.y - currentPoint.y) * localProgress
                };
            }
        }
        return null;
    }
    
    checkForClicks() {
        if (!this.isPlaying) return;
        
        // Check if we should trigger click animations
        for (let curve of this.curves) {
            curve.clicks.forEach(click => {
                const timeDiff = Math.abs(this.currentTime - click.time);
                if (timeDiff < (0.1 / this.playbackSpeed)) { // Within 100ms adjusted for speed
                    this.triggerClickAnimation(click);
                }
            });
        }
    }
    
    triggerClickAnimation(click) {
        // Avoid duplicate animations
        if (click.animated) return;
        click.animated = true;
        
        setTimeout(() => {
            click.animated = false;
        }, 1000);
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.clickAnimations.getBoundingClientRect();
        
        const offsetX = (canvasRect.left - containerRect.left) + click.x;
        const offsetY = (canvasRect.top - containerRect.top) + click.y;
        
        const animation = document.createElement('div');
        animation.className = 'click-animation';
        animation.style.left = `${offsetX - 20}px`;
        animation.style.top = `${offsetY - 20}px`;
        animation.style.borderColor = click.button === 'left' ? '#ef4444' : 
                                    click.button === 'right' ? '#f59e0b' : '#8b5cf6';
        
        this.clickAnimations.appendChild(animation);
        
        // Remove animation after completion
        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 600);
    }
    
    // Utility method to add new curve points (for future editing features)
    addCurvePoint(curveIndex, x, y, insertIndex = -1) {
        const curve = this.curves[curveIndex];
        if (!curve) return;
        
        const newPoint = {
            x: x,
            y: y,
            time: curve.startTime + (curve.endTime - curve.startTime) * 
                  (insertIndex >= 0 ? insertIndex / curve.points.length : 1)
        };
        
        if (insertIndex >= 0) {
            curve.points.splice(insertIndex, 0, newPoint);
        } else {
            curve.points.push(newPoint);
        }
        
        this.render();
    }
    
    // Method to smooth/simplify curves
    simplifyCurve(curveIndex, tolerance = 2) {
        const curve = this.curves[curveIndex];
        if (!curve || curve.points.length < 3) return;
        
        // Simple Douglas-Peucker-like algorithm
        const simplified = [curve.points[0]];
        
        for (let i = 1; i < curve.points.length - 1; i++) {
            const prev = simplified[simplified.length - 1];
            const current = curve.points[i];
            const next = curve.points[i + 1];
            
            // Calculate distance from current point to line between prev and next
            const distance = this.pointToLineDistance(current, prev, next);
            
            if (distance > tolerance) {
                simplified.push(current);
            }
        }
        
        simplified.push(curve.points[curve.points.length - 1]);
        curve.points = simplified;
        
        this.render();
    }
    
    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        const param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const editor = new CurveEditor();
    
    // Make editor globally accessible for debugging
    window.curveEditor = editor;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        editor.setupCanvas();
        editor.render();
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            editor.togglePlayback();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            editor.currentTime = Math.max(0, editor.currentTime - 0.5);
            editor.updateTimeDisplay();
            editor.render();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            editor.currentTime = Math.min(editor.totalTime, editor.currentTime + 0.5);
            editor.updateTimeDisplay();
            editor.render();
        } else if (e.code === 'Home') {
            e.preventDefault();
            editor.currentTime = 0;
            editor.updateTimeDisplay();
            editor.render();
        } else if (e.code === 'End') {
            e.preventDefault();
            editor.currentTime = editor.totalTime;
            editor.updateTimeDisplay();
            editor.render();
        }
    });
});