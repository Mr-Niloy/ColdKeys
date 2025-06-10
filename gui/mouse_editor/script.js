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
        const centerX = 400;
        const centerY = 300;
        
        // Generate 5 different curve segments
        for (let i = 0; i < 5; i++) {
            const startTime = i * 2.5;
            const endTime = (i + 1) * 2.5;
            const points = [];
            
            // Create curved path
            const numPoints = 20 + Math.random() * 30;
            for (let j = 0; j < numPoints; j++) {
                const t = j / (numPoints - 1);
                const angle = t * Math.PI * 2 + i * Math.PI * 0.5;
                const radius = 80 + Math.sin(t * Math.PI * 4) * 30;
                
                points.push({
                    x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
                    y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
                    time: startTime + t * (endTime - startTime)
                });
            }
            
            // Add some clicks
            const clicks = [];
            if (Math.random() > 0.5) {
                clicks.push({
                    x: points[Math.floor(points.length * 0.3)].x,
                    y: points[Math.floor(points.length * 0.3)].y,
                    time: startTime + (endTime - startTime) * 0.3,
                    button: 'left'
                });
            }
            if (Math.random() > 0.7) {
                clicks.push({
                    x: points[Math.floor(points.length * 0.7)].x,
                    y: points[Math.floor(points.length * 0.7)].y,
                    time: startTime + (endTime - startTime) * 0.7,
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
                opacity: 1 - (i * 0.1) // Fade older curves
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
            });
        });
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if clicking on a curve point for editing
            this.handleCanvasClick(x, y);
        });
    }
    
    handleCanvasClick(x, y) {
        // Find if click is near any curve point
        const selectedCurve = this.curves[this.selectedCurve];
        if (!selectedCurve) return;
        
        for (let point of selectedCurve.points) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance < 10) {
                // Point selected - could implement editing here
                console.log('Point selected:', point);
                break;
            }
        }
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
        this.ctx.fillStyle = 'rgba(255, 107, 53, 0.8)';
        this.ctx.strokeStyle = 'rgba(255, 107, 53, 1)';
        this.ctx.lineWidth = 1;
        
        curve.points.forEach((point, index) => {
            if (index % 5 === 0) { // Show every 5th point to avoid clutter
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
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