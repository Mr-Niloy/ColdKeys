import sys
import time
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTableWidget, QTableWidgetItem, QPushButton, QLabel, QHeaderView,
    QFrame, QLineEdit, QScrollArea, QSizePolicy
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread, pyqtSlot
from PyQt6.QtGui import QFont, QIcon, QPalette, QColor, QPixmap, QPainter


@dataclass
class MacroAction:
    action_type: str
    action: str
    details: str
    timestamp: float
    delay: float
    duration: float
    position: str = ""
    

class MacroRecorderThread(QThread):
    """Thread for handling macro recording"""
    action_recorded = pyqtSignal(object)
    
    def __init__(self):
        super().__init__()
        self.recording = False
        self.paused = False
        
    def start_recording(self):
        self.recording = True
        self.paused = False
        
    def pause_recording(self):
        self.paused = not self.paused
        
    def stop_recording(self):
        self.recording = False
        self.paused = False
        
    def run(self):
        # Placeholder for actual recording logic
        # In a real implementation, you would capture keyboard/mouse events here
        pass


class StatWidget(QFrame):
    """Custom widget for displaying statistics"""
    
    def __init__(self, value: str, label: str):
        super().__init__()
        self.setFixedSize(120, 80)
        self.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 rgba(255, 255, 255, 0.05),
                    stop:1 rgba(255, 255, 255, 0.02));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                margin: 5px;
            }
        """)
        
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(2)
        
        self.value_label = QLabel(value)
        self.value_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.value_label.setStyleSheet("""
            QLabel {
                font-size: 24px;
                font-weight: 600;
                color: #d52f67;
                background: transparent;
                border: none;
            }
        """)
        
        self.desc_label = QLabel(label)
        self.desc_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.desc_label.setStyleSheet("""
            QLabel {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                background: transparent;
                border: none;
            }
        """)
        
        layout.addWidget(self.value_label)
        layout.addWidget(self.desc_label)
        
    def update_value(self, value: str):
        self.value_label.setText(value)


class StatusIndicator(QFrame):
    """Custom status indicator widget"""
    
    def __init__(self):
        super().__init__()
        self.setFixedSize(12, 12)
        self.is_recording = False
        self.setStyleSheet("""
            QFrame {
                border-radius: 6px;
                background-color: rgba(255, 255, 255, 0.4);
            }
        """)
        
        # Timer for blinking effect
        self.blink_timer = QTimer()
        self.blink_timer.timeout.connect(self.toggle_blink)
        self.blink_state = True
        
    def set_recording(self, recording: bool):
        self.is_recording = recording
        if recording:
            self.setStyleSheet("""
                QFrame {
                    border-radius: 6px;
                    background-color: #ff4444;
                    border: 2px solid #ff4444;
                }
            """)
            self.blink_timer.start(500)
        else:
            self.setStyleSheet("""
                QFrame {
                    border-radius: 6px;
                    background-color: rgba(255, 255, 255, 0.4);
                }
            """)
            self.blink_timer.stop()
            
    def toggle_blink(self):
        if self.is_recording:
            if self.blink_state:
                self.setStyleSheet("""
                    QFrame {
                        border-radius: 6px;
                        background-color: rgba(255, 68, 68, 0.3);
                    }
                """)
            else:
                self.setStyleSheet("""
                    QFrame {
                        border-radius: 6px;
                        background-color: #ff4444;
                    }
                """)
            self.blink_state = not self.blink_state


class MacroRecorderApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.actions: List[MacroAction] = []
        self.is_recording = False
        self.is_paused = False
        self.start_time = None
        self.total_actions = 0
        self.keystrokes = 0
        self.mouse_actions = 0
        
        # Recording thread
        self.recorder_thread = MacroRecorderThread()
        self.recorder_thread.action_recorded.connect(self.add_action)
        
        # Timer for updating duration
        self.duration_timer = QTimer()
        self.duration_timer.timeout.connect(self.update_duration)
        
        self.init_ui()
        self.apply_styles()
        
    def init_ui(self):
        self.setWindowTitle("Macro Recorder")
        self.setMinimumSize(1200, 800)
        self.resize(1400, 900)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(20)
        main_layout.setContentsMargins(20, 20, 20, 20)
        
        # Header
        self.create_header(main_layout)
        
        # Table
        self.create_table(main_layout)
        
    def create_header(self, parent_layout):
        # Header frame
        header_frame = QFrame()
        header_frame.setFixedHeight(120)
        header_frame.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 rgba(255, 255, 255, 0.1),
                    stop:1 rgba(255, 255, 255, 0.05));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
            }
        """)
        
        header_layout = QHBoxLayout(header_frame)
        header_layout.setContentsMargins(30, 20, 30, 20)
        
        # Title section
        title_layout = QVBoxLayout()
        title_label = QLabel("🎵 Macro Recorder")
        title_label.setStyleSheet("""
            QLabel {
                font-size: 24px;
                font-weight: 600;
                color: white;
                background: transparent;
            }
        """)
        title_layout.addWidget(title_label)
        title_layout.addStretch()
        
        # Stats section
        stats_layout = QHBoxLayout()
        stats_layout.setSpacing(10)
        
        self.total_actions_stat = StatWidget("0", "Total Actions")
        self.duration_stat = StatWidget("0.0s", "Duration")
        self.keystrokes_stat = StatWidget("0", "Keystrokes")
        self.mouse_actions_stat = StatWidget("0", "Mouse Actions")
        
        stats_layout.addWidget(self.total_actions_stat)
        stats_layout.addWidget(self.duration_stat)
        stats_layout.addWidget(self.keystrokes_stat)
        stats_layout.addWidget(self.mouse_actions_stat)
        
        # Controls section
        controls_layout = QVBoxLayout()
        
        # Status
        status_layout = QHBoxLayout()
        self.status_indicator = StatusIndicator()
        self.status_text = QLabel("Ready")
        self.status_text.setStyleSheet("""
            QLabel {
                color: white;
                background: transparent;
                font-size: 14px;
                margin-left: 10px;
            }
        """)
        
        status_frame = QFrame()
        status_frame.setStyleSheet("""
            QFrame {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 8px 15px;
            }
        """)
        status_frame_layout = QHBoxLayout(status_frame)
        status_frame_layout.addWidget(self.status_indicator)
        status_frame_layout.addWidget(self.status_text)
        status_frame_layout.addStretch()
        
        # Buttons
        buttons_layout = QHBoxLayout()
        
        self.record_btn = QPushButton("▶ Start Recording")
        self.record_btn.clicked.connect(self.toggle_recording)
        
        self.pause_btn = QPushButton("⏸")
        self.pause_btn.clicked.connect(self.pause_recording)
        self.pause_btn.setEnabled(False)
        
        self.stop_btn = QPushButton("⏹")
        self.stop_btn.clicked.connect(self.stop_recording)
        self.stop_btn.setEnabled(False)
        
        self.clear_btn = QPushButton("🗑")
        self.clear_btn.clicked.connect(self.clear_actions)
        
        self.save_btn = QPushButton("💾")
        self.save_btn.clicked.connect(self.save_macro)
        
        # Style buttons
        button_style = """
            QPushButton {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: white;
                font-weight: 600;
                min-width: 40px;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
            }
            QPushButton:pressed {
                background: rgba(255, 255, 255, 0.05);
            }
            QPushButton:disabled {
                opacity: 0.5;
            }
        """
        
        record_style = """
            QPushButton {
                background: #4CAF50;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                color: white;
                font-weight: 600;
                font-size: 14px;
            }
            QPushButton:hover {
                background: #45a049;
            }
        """
        
        self.record_btn.setStyleSheet(record_style)
        self.pause_btn.setStyleSheet(button_style)
        self.stop_btn.setStyleSheet(button_style)
        self.clear_btn.setStyleSheet(button_style)
        self.save_btn.setStyleSheet(button_style)
        
        buttons_layout.addWidget(self.record_btn)
        buttons_layout.addWidget(self.pause_btn)
        buttons_layout.addWidget(self.stop_btn)
        buttons_layout.addWidget(self.clear_btn)
        buttons_layout.addWidget(self.save_btn)
        
        controls_layout.addWidget(status_frame)
        controls_layout.addLayout(buttons_layout)
        
        # Add to header
        header_layout.addLayout(title_layout)
        header_layout.addStretch()
        header_layout.addLayout(stats_layout)
        header_layout.addStretch()
        header_layout.addLayout(controls_layout)
        
        parent_layout.addWidget(header_frame)
        
    def create_table(self, parent_layout):
        # Table widget
        self.table = QTableWidget()
        self.table.setColumnCount(9)
        self.table.setHorizontalHeaderLabels([
            "#", "Type", "Action", "Details", "Timestamp", "Delay", "Duration", "Position", "🔧"
        ])
        
        # Set column widths
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.Fixed)
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Fixed)
        header.setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(4, QHeaderView.ResizeMode.Fixed)
        header.setSectionResizeMode(5, QHeaderView.ResizeMode.Fixed)
        header.setSectionResizeMode(6, QHeaderView.ResizeMode.Fixed)
        header.setSectionResizeMode(7, QHeaderView.ResizeMode.Fixed)
        header.setSectionResizeMode(8, QHeaderView.ResizeMode.Fixed)
        
        self.table.setColumnWidth(0, 60)
        self.table.setColumnWidth(1, 120)
        self.table.setColumnWidth(4, 120)
        self.table.setColumnWidth(5, 100)
        self.table.setColumnWidth(6, 100)
        self.table.setColumnWidth(7, 150)
        self.table.setColumnWidth(8, 50)
        
        # Style table
        self.table.setStyleSheet("""
            QTableWidget {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 rgba(255, 255, 255, 0.08),
                    stop:1 transparent);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                gridline-color: rgba(255, 255, 255, 0.1);
                color: white;
            }
            QTableWidget::item {
                padding: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            QTableWidget::item:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            QHeaderView::section {
                background-color: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.8);
                padding: 15px;
                border: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-weight: 600;
            }
        """)
        
        self.table.setAlternatingRowColors(True)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        
        # Add empty state
        self.show_empty_state()
        
        parent_layout.addWidget(self.table)
        
    def show_empty_state(self):
        self.table.setRowCount(1)
        empty_item = QTableWidgetItem("No actions recorded yet\nClick 'Start Recording' to begin capturing keystrokes and mouse movements")
        empty_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
        empty_item.setFlags(Qt.ItemFlag.ItemIsEnabled)
        self.table.setItem(0, 0, empty_item)
        self.table.setSpan(0, 0, 1, 9)
        
    def apply_styles(self):
        # Main window style
        self.setStyleSheet("""
            QMainWindow {
                background: qradialgradient(cx:0.5, cy:0.5, radius:1,
                    stop:0 rgba(40, 44, 52, 1),
                    stop:1 rgba(25, 28, 35, 1));
            }
            QWidget {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
        """)
        
    def toggle_recording(self):
        if not self.is_recording:
            self.start_recording()
        else:
            self.stop_recording()
            
    def start_recording(self):
        self.is_recording = True
        self.is_paused = False
        self.start_time = time.time()
        
        # Update UI
        self.record_btn.setText("⏹ Stop Recording")
        self.record_btn.setStyleSheet("""
            QPushButton {
                background: #f44444;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                color: white;
                font-weight: 600;
                font-size: 14px;
            }
            QPushButton:hover {
                background: #d32f2f;
            }
        """)
        
        self.pause_btn.setEnabled(True)
        self.stop_btn.setEnabled(True)
        self.status_indicator.set_recording(True)
        self.status_text.setText("Recording...")
        
        # Clear empty state
        if self.table.rowCount() == 1 and self.table.item(0, 0).text().startswith("No actions"):
            self.table.setRowCount(0)
            
        # Start duration timer
        self.duration_timer.start(100)
        
        # Start recording thread
        self.recorder_thread.start_recording()
        if not self.recorder_thread.isRunning():
            self.recorder_thread.start()
            
        # Add some demo actions for testing
        QTimer.singleShot(1000, lambda: self.add_demo_action("keyboard", "Key Press", "Space", "32x32"))
        QTimer.singleShot(2000, lambda: self.add_demo_action("mouse", "Click", "Left Click", "150, 200"))
        QTimer.singleShot(3000, lambda: self.add_demo_action("keyboard", "Key Press", "Ctrl+C", ""))
        
    def pause_recording(self):
        self.is_paused = not self.is_paused
        if self.is_paused:
            self.status_text.setText("Paused")
            self.duration_timer.stop()
            self.recorder_thread.pause_recording()
        else:
            self.status_text.setText("Recording...")
            self.duration_timer.start(100)
            
    def stop_recording(self):
        self.is_recording = False
        self.is_paused = False
        
        # Update UI
        self.record_btn.setText("▶ Start Recording")
        self.record_btn.setStyleSheet("""
            QPushButton {
                background: #4CAF50;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                color: white;
                font-weight: 600;
                font-size: 14px;
            }
            QPushButton:hover {
                background: #45a049;
            }
        """)
        
        self.pause_btn.setEnabled(False)
        self.stop_btn.setEnabled(False)
        self.status_indicator.set_recording(False)
        self.status_text.setText("Ready")
        
        # Stop timers and thread
        self.duration_timer.stop()
        self.recorder_thread.stop_recording()
        
    def clear_actions(self):
        self.actions.clear()
        self.table.setRowCount(0)
        self.total_actions = 0
        self.keystrokes = 0
        self.mouse_actions = 0
        self.update_stats()
        self.show_empty_state()
        
    def save_macro(self):
        # Placeholder for save functionality
        print("Save macro functionality would be implemented here")
        
    def add_demo_action(self, action_type: str, action: str, details: str, position: str):
        if self.is_recording and not self.is_paused:
            current_time = time.time()
            delay = current_time - (self.start_time if len(self.actions) == 0 else self.actions[-1].timestamp)
            
            macro_action = MacroAction(
                action_type=action_type,
                action=action,
                details=details,
                timestamp=current_time,
                delay=delay,
                duration=0.1,
                position=position
            )
            
            self.add_action(macro_action)
        
    @pyqtSlot(object)
    def add_action(self, action: MacroAction):
        self.actions.append(action)
        self.total_actions += 1
        
        if action.action_type == "keyboard":
            self.keystrokes += 1
        elif action.action_type == "mouse":
            self.mouse_actions += 1
            
        self.update_table()
        self.update_stats()
        
    def update_table(self):
        self.table.setRowCount(len(self.actions))
        
        for i, action in enumerate(self.actions):
            # Index
            self.table.setItem(i, 0, QTableWidgetItem(str(i + 1)))
            
            # Type with icon
            type_item = QTableWidgetItem(f"{'⌨️' if action.action_type == 'keyboard' else '🖱️'} {action.action_type.title()}")
            self.table.setItem(i, 1, type_item)
            
            # Action
            self.table.setItem(i, 2, QTableWidgetItem(action.action))
            
            # Details
            self.table.setItem(i, 3, QTableWidgetItem(action.details))
            
            # Timestamp
            timestamp_str = datetime.fromtimestamp(action.timestamp).strftime("%H:%M:%S.%f")[:-3]
            self.table.setItem(i, 4, QTableWidgetItem(timestamp_str))
            
            # Delay
            delay_item = QLineEdit(f"{action.delay:.3f}s")
            delay_item.setStyleSheet("""
                QLineEdit {
                    background: transparent;
                    border: 1px solid transparent;
                    color: #ffc107;
                    font-family: 'Courier New', monospace;
                    padding: 4px;
                    border-radius: 4px;
                }
                QLineEdit:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.05);
                }
                QLineEdit:focus {
                    border-color: #d52f67;
                    background: rgba(255, 255, 255, 0.05);
                }
            """)
            self.table.setCellWidget(i, 5, delay_item)
            
            # Duration
            duration_item = QLineEdit(f"{action.duration:.3f}s")
            duration_item.setStyleSheet("""
                QLineEdit {
                    background: transparent;
                    border: 1px solid transparent;
                    color: #d52f67;
                    font-family: 'Courier New', monospace;
                    padding: 4px;
                    border-radius: 4px;
                }
                QLineEdit:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.05);
                }
                QLineEdit:focus {
                    border-color: #d52f67;
                    background: rgba(255, 255, 255, 0.05);
                }
            """)
            self.table.setCellWidget(i, 6, duration_item)
            
            # Position
            self.table.setItem(i, 7, QTableWidgetItem(action.position))
            
            # Delete button
            delete_btn = QPushButton("🗑")
            delete_btn.setStyleSheet("""
                QPushButton {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #f44444;
                    border-radius: 19px;
                    width: 38px;
                    height: 38px;
                    font-size: 12px;
                }
                QPushButton:hover {
                    background: rgba(255, 68, 68, 0.1);
                    border-color: #f44444;
                }
            """)
            delete_btn.clicked.connect(lambda checked, idx=i: self.delete_action(idx))
            self.table.setCellWidget(i, 8, delete_btn)
            
    def delete_action(self, index: int):
        if 0 <= index < len(self.actions):
            action = self.actions[index]
            self.actions.pop(index)
            self.total_actions -= 1
            
            if action.action_type == "keyboard":
                self.keystrokes -= 1
            elif action.action_type == "mouse":
                self.mouse_actions -= 1
                
            self.update_table()
            self.update_stats()
            
            if len(self.actions) == 0:
                self.show_empty_state()
        
    def update_stats(self):
        self.total_actions_stat.update_value(str(self.total_actions))
        self.keystrokes_stat.update_value(str(self.keystrokes))
        self.mouse_actions_stat.update_value(str(self.mouse_actions))
        
    def update_duration(self):
        if self.is_recording and self.start_time:
            duration = time.time() - self.start_time
            self.duration_stat.update_value(f"{duration:.1f}s")


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # Use Fusion style for better cross-platform appearance
    
    # Set application palette for dark theme
    palette = QPalette()
    palette.setColor(QPalette.ColorRole.Window, QColor(40, 44, 52))
    palette.setColor(QPalette.ColorRole.WindowText, QColor(255, 255, 255))
    palette.setColor(QPalette.ColorRole.Base, QColor(25, 28, 35))
    palette.setColor(QPalette.ColorRole.AlternateBase, QColor(45, 49, 56))
    palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(255, 255, 255))
    palette.setColor(QPalette.ColorRole.ToolTipText, QColor(255, 255, 255))
    palette.setColor(QPalette.ColorRole.Text, QColor(255, 255, 255))
    palette.setColor(QPalette.ColorRole.Button, QColor(53, 53, 53))
    palette.setColor(QPalette.ColorRole.ButtonText, QColor(255, 255, 255))
    palette.setColor(QPalette.ColorRole.BrightText, QColor(255, 0, 0))
    palette.setColor(QPalette.ColorRole.Link, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
    palette.setColor(QPalette.ColorRole.HighlightedText, QColor(0, 0, 0))
    app.setPalette(palette)
    
    window = MacroRecorderApp()
    window.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()