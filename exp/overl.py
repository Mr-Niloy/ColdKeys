#!/usr/bin/env python3
"""
Qt6 Overlay Menu System
A stylish overlay interface with volume slider and emoji box
"""
import signal
import sys
import random
import math
from PyQt6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLabel, QSlider, QPushButton, QGraphicsDropShadowEffect,
                             QGridLayout, QFrame)
from PyQt6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve, QRect, pyqtSignal
from PyQt6.QtGui import QFont, QPalette, QColor, QPainter, QPen, QBrush, QLinearGradient
from PyQt6.QtGui import QWindow
class ModernSlider(QSlider):
    """Custom modern volume slider with gradient and glow effects"""
    
    def __init__(self, orientation=Qt.Orientation.Horizontal):
        super().__init__(orientation)
        self.setMinimum(0)
        self.setMaximum(100)
        self.setValue(50)
        self.setFixedSize(200, 40)
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Track background
        track_rect = QRect(20, 17, 160, 6)
        painter.setBrush(QBrush(QColor(40, 40, 40)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(track_rect, 3, 3)
        
        # Progress fill with gradient
        progress_width = int((self.value() / self.maximum()) * 160)
        if progress_width > 0:
            gradient = QLinearGradient(20, 17, 20 + progress_width, 23)
            gradient.setColorAt(0, QColor(100, 200, 255))
            gradient.setColorAt(1, QColor(50, 150, 255))
            painter.setBrush(QBrush(gradient))
            painter.drawRoundedRect(20, 17, progress_width, 6, 3, 3)
        
        # Handle
        handle_x = 20 + progress_width - 8
        handle_rect = QRect(handle_x, 12, 16, 16)
        
        # Handle glow effect
        glow_gradient = QLinearGradient(handle_x, 12, handle_x, 28)
        glow_gradient.setColorAt(0, QColor(255, 255, 255, 100))
        glow_gradient.setColorAt(1, QColor(100, 200, 255, 200))
        painter.setBrush(QBrush(glow_gradient))
        painter.drawEllipse(handle_rect)
        
        # Handle inner circle
        inner_rect = QRect(handle_x + 2, 14, 12, 12)
        painter.setBrush(QBrush(QColor(255, 255, 255)))
        painter.drawEllipse(inner_rect)

class VolumeOverlay(QWidget):
    """Stylish volume overlay widget"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.setup_animations()
        
    def init_ui(self):
        self.setWindowFlags(
        Qt.WindowType.FramelessWindowHint |
        Qt.WindowType.WindowStaysOnTopHint |
        Qt.WindowType.Tool |
        Qt.WindowType.SplashScreen |
        Qt.WindowType.X11BypassWindowManagerHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(280, 120)
        self.setWindowFlag(Qt.WindowType.WindowDoesNotAcceptFocus)
        self.setFocusPolicy(Qt.FocusPolicy.NoFocus)

        
        # Main layout
        layout = QVBoxLayout()
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Title
        title = QLabel("🔊 Volume")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        title.setStyleSheet("""
            color: white;
            background: transparent;
            padding: 5px;
        """)
        
        # Volume slider
        self.volume_slider = ModernSlider()
        
        # Volume percentage label
        self.volume_label = QLabel("50%")
        self.volume_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.volume_label.setFont(QFont("Arial", 12))
        self.volume_label.setStyleSheet("""
            color: #64B5F6;
            background: transparent;
            font-weight: bold;
        """)
        
        layout.addWidget(title)
        layout.addWidget(self.volume_slider)
        layout.addWidget(self.volume_label)
        
        self.setLayout(layout)
        
        # Styling
        self.setStyleSheet("""
            QWidget {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                    stop:0 rgba(30, 30, 30, 240),
                    stop:1 rgba(20, 20, 20, 240));
                border-radius: 15px;
                border: 1px solid rgba(100, 181, 246, 100);
            }
        """)
        
        # Drop shadow effect
        shadow = QGraphicsDropShadowEffect()
        shadow.setBlurRadius(25)
        shadow.setColor(QColor(0, 0, 0, 100))
        shadow.setOffset(0, 5)
        self.setGraphicsEffect(shadow)
        
        # Connect slider
        self.volume_slider.valueChanged.connect(self.update_volume_label)
        
    def update_volume_label(self, value):
        self.volume_label.setText(f"{value}%")
        
    def setup_animations(self):
        self.fade_animation = QPropertyAnimation(self, b"windowOpacity")
        self.fade_animation.setDuration(300)
        self.fade_animation.setEasingCurve(QEasingCurve.Type.OutCubic)
        
    def show_overlay(self):
        self.setWindowOpacity(0)
        self.show()
        window = self.windowHandle()
        if window:
            window.setFlag(Qt.WindowType.ToolTip, True)

        self.fade_animation.setStartValue(0)
        self.fade_animation.setEndValue(1)
        self.fade_animation.start()
        
        
    def hide_overlay(self):
        self.fade_animation.setStartValue(1)
        self.fade_animation.setEndValue(0)
        self.fade_animation.finished.connect(self.hide)
        self.fade_animation.start()

class EmojiBox(QWidget):
    """Stylish emoji selection box"""
    
    emoji_selected = pyqtSignal(str)
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.setup_animations()
        
    def init_ui(self):
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool |
            Qt.WindowType.SplashScreen |
            Qt.WindowType.X11BypassWindowManagerHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(240*2, 180*2)
        self.setWindowFlag(Qt.WindowType.WindowDoesNotAcceptFocus)
        self.setFocusPolicy(Qt.FocusPolicy.NoFocus)

        
        # Main layout
        layout = QVBoxLayout()
        layout.setContentsMargins(15, 15, 15, 15)
        
        # Title
        title = QLabel("😊 Quick Emojis")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setFont(QFont("Arial", 12, QFont.Weight.Bold))
        title.setStyleSheet("""
            color: white;
            background: transparent;
            padding: 5px;
        """)
        
        # Emoji grid
        emoji_frame = QFrame()
        emoji_layout = QGridLayout(emoji_frame)
        emoji_layout.setSpacing(5)
        
        emojis = [
            "🙂", "😀", "😄", "😁", "😆", "🤗", "🤩",
            "😊", "🙂", "😌", "😇", "😅", "😉", "😋",
            "😐", "😶", "😑", "😬", "😕", "🙃", "😒",
            "😔", "😞", "😟", "😢", "😥", "😓", "😩",
            "😤", "😠", "😡", "🤬", "😣", "😖", "😫"
        ]
        
        for i, emoji in enumerate(emojis):
            btn = QPushButton(emoji)
            btn.setFixedSize(35, 35)
            btn.setFont(QFont("Arial", 16))
            btn.setStyleSheet("""
                QPushButton {
                    background: rgba(255, 255, 255, 20);
                    border: 1px solid rgba(100, 181, 246, 50);
                    border-radius: 17px;
                    padding: 5px;
                }
                QPushButton:hover {
                    background: rgba(100, 181, 246, 100);
                    border: 1px solid rgba(100, 181, 246, 150);
                }
                QPushButton:pressed {
                    background: rgba(100, 181, 246, 200);
                }
            """)
            btn.clicked.connect(lambda checked, e=emoji: self.emoji_selected.emit(e))
            emoji_layout.addWidget(btn, i // 4, i % 4)
        
        layout.addWidget(title)
        layout.addWidget(emoji_frame)
        
        self.setLayout(layout)
        
        # Styling
        self.setStyleSheet("""
            QWidget {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                    stop:0 rgba(45, 45, 45, 240),
                    stop:1 rgba(25, 25, 25, 240));
                border-radius: 15px;
                border: 1px solid rgba(100, 181, 246, 100);
            }
        """)
        
        # Drop shadow effect
        shadow = QGraphicsDropShadowEffect()
        shadow.setBlurRadius(25)
        shadow.setColor(QColor(0, 0, 0, 120))
        shadow.setOffset(0, 5)
        self.setGraphicsEffect(shadow)
        
    def setup_animations(self):
        self.fade_animation = QPropertyAnimation(self, b"windowOpacity")
        self.fade_animation.setDuration(250)
        self.fade_animation.setEasingCurve(QEasingCurve.Type.OutCubic)
        
    def show_overlay(self):
        self.setWindowOpacity(0)
        self.show()
        window = self.windowHandle()
        if window:
            window.setFlag(Qt.WindowType.ToolTip, True)

        self.fade_animation.setStartValue(0)
        self.fade_animation.setEndValue(1)
        self.fade_animation.start()
        
    def hide_overlay(self):
        self.fade_animation.setStartValue(1)
        self.fade_animation.setEndValue(0)
        self.fade_animation.finished.connect(self.hide)
        self.fade_animation.start()

class OverlayMenuSystem(QWidget):
    """Main overlay menu system controller"""
    
    def __init__(self):
        super().__init__()
        self.volume_overlay = None
        self.emoji_box = None
        self.init_system()
        self.setup_timers()
        
    def init_system(self):
        # Hide main window
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setFixedSize(1, 1)
        self.hide()
        
        # Create overlays
        self.volume_overlay = VolumeOverlay()
        self.emoji_box = EmojiBox()
        self.emoji_box.emoji_selected.connect(self.on_emoji_selected)
        
    def setup_timers(self):
        # Simulate keyboard input for volume slider (delay simulation)
        self.volume_timer = QTimer()
        self.volume_timer.timeout.connect(self.show_volume_overlay)
        self.volume_timer.start(3000)  # Show every 3 seconds
        
        # Simulate mouse movement for volume changes
        self.mouse_timer = QTimer()
        self.mouse_timer.timeout.connect(self.simulate_mouse_movement)
        
        # Simulate right click to hide volume
        self.hide_timer = QTimer()
        self.hide_timer.timeout.connect(self.hide_volume_overlay)
        
        # Show emoji box periodically
        self.emoji_timer = QTimer()
        self.emoji_timer.timeout.connect(self.show_emoji_box)
        self.emoji_timer.start(8000)  # Show every 8 seconds
        
    def show_volume_overlay(self):
        if not self.volume_overlay.isVisible():
            # Position randomly on screen
            screen = QApplication.primaryScreen().geometry()
            x = random.randint(50, screen.width() - 330)
            y = random.randint(50, screen.height() - 170)
            self.volume_overlay.move(x, y)
            self.volume_overlay.show_overlay()
            
            # Start mouse simulation
            self.mouse_timer.start(200)
            
            # Set random hide delay
            hide_delay = random.randint(2000, 5000)
            self.hide_timer.start(hide_delay)
    
    def simulate_mouse_movement(self):
        if self.volume_overlay.isVisible():
            # Simulate volume changes as if mouse is moving
            current_volume = self.volume_overlay.volume_slider.value()
            change = random.randint(-5, 5)
            new_volume = max(0, min(100, current_volume + change))
            self.volume_overlay.volume_slider.setValue(new_volume)
    
    def hide_volume_overlay(self):
        if self.volume_overlay.isVisible():
            self.volume_overlay.hide_overlay()
            self.mouse_timer.stop()
            self.hide_timer.stop()
    
    def show_emoji_box(self):
        if not self.emoji_box.isVisible():
            # Position randomly on screen
            screen = QApplication.primaryScreen().geometry()
            x = random.randint(50, screen.width() - 290)
            y = random.randint(50, screen.height() - 230)
            self.emoji_box.move(x, y)
            self.emoji_box.show_overlay()
            
            # Auto hide after random delay
            hide_delay = random.randint(3000, 6000)
            QTimer.singleShot(hide_delay, self.emoji_box.hide_overlay)
    
    def on_emoji_selected(self, emoji):
        print(f"Selected emoji: {emoji}")
        self.emoji_box.hide_overlay()

def main():
    app = QApplication(sys.argv)

    # Set application style
    app.setStyle('Fusion')
    
    # Dark palette
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor(53, 53, 53))
    palette.setColor(QPalette.ColorRole.WindowText, QColor(255, 255, 255))
    app.setPalette(palette)

    # Handle Ctrl+C gracefully
    signal.signal(signal.SIGINT, signal.SIG_DFL)

    # Create overlay system
    overlay_system = OverlayMenuSystem()

    print("Overlay Menu System Started!")
    print("- Volume slider will appear every 3 seconds")
    print("- Emoji box will appear every 8 seconds")
    print("- Press Ctrl+C to exit")

    sys.exit(app.exec())

if __name__ == "__main__":
    main()