#!/usr/bin/env python3
"""
Macro Recorder - Native Linux GUI Application
A Python application that replicates the web-based macro recorder with native GUI
"""

import sys
import time
import json
from datetime import datetime
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                           QHBoxLayout, QTableWidget, QTableWidgetItem, QPushButton, 
                           QLabel, QHeaderView, QFrame, QScrollArea, QFileDialog,
                           QMessageBox, QLineEdit, QAbstractItemView)
from PyQt5.QtCore import Qt, QTimer, QThread, pyqtSignal, QRect
from PyQt5.QtGui import QFont, QIcon, QPalette, QColor, QPixmap, QPainter
from pynput import mouse, keyboard
from pynput.mouse import Button, Listener as MouseListener
from pynput.keyboard import Key, Listener as KeyboardListener

class MacroRecorder(QThread):
    action_recorded = pyqtSignal(dict)
    
    def __init__(self):
        super().__init__()
        self.recording = False
        self.paused = False
        self.start_time = None
        self.last_action_time = None
        self.actions = []
        self.mouse_listener = None
        self.keyboard_listener = None
        
    def start_recording(self):
        self.recording = True
        self.paused = False
        self.start_time = time.time()
        self.last_action_time = self.start_time
        self.actions = []
        
        # Start listeners
        self.mouse_listener = MouseListener(
            on_click=self.on_mouse_click,
            on_move=self.on_mouse_move,
            on_scroll=self.on_mouse_scroll
        )
        self.keyboard_listener = KeyboardListener(
            on_press=self.on_key_press,
            on_release=self.on_key_release
        )
        
        self.mouse_listener.start()
        self.keyboard_listener.start()
        
    def stop_recording(self):
        self.recording = False
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()
            
    def pause_recording(self):
        self.paused = not self.paused
        
    def on_mouse_click(self, x, y, button, pressed):
        if self.recording and not self.paused:
            current_time = time.time()
            action = {
                'type': 'Mouse',
                'action': f'{"Press" if pressed else "Release"} {button.name.title()}',
                'details': f'Button: {button.name.title()}',
                'timestamp': current_time - self.start_time,
                'delay': current_time - self.last_action_time,
                'duration': 0,
                'position': f'({x}, {y})'
            }
            self.last_action_time = current_time
            self.actions.append(action)
            self.action_recorded.emit(action)
            
    def on_mouse_move(self, x, y):
        # Only record significant movements to avoid spam
        pass
        
    def on_mouse_scroll(self, x, y, dx, dy):
        if self.recording and not self.paused:
            current_time = time.time()
            direction = "Up" if dy > 0 else "Down"
            action = {
                'type': 'Mouse',
                'action': f'Scroll {direction}',
                'details': f'Delta: ({dx}, {dy})',
                'timestamp': current_time - self.start_time,
                'delay': current_time - self.last_action_time,
                'duration': 0,
                'position': f'({x}, {y})'
            }
            self.last_action_time = current_time
            self.actions.append(action)
            self.action_recorded.emit(action)
            
    def on_key_press(self, key):
        if self.recording and not self.paused:
            current_time = time.time()
            key_name = self.get_key_name(key)
            action = {
                'type': 'Keyboard',
                'action': 'Key Press',
                'details': f'Key: {key_name}',
                'timestamp': current_time - self.start_time,
                'delay': current_time - self.last_action_time,
                'duration': 0,
                'position': ''
            }
            self.last_action_time = current_time
            self.actions.append(action)
            self.action_recorded.emit(action)
            
    def on_key_release(self, key):
        if self.recording and not self.paused:
            current_time = time.time()
            key_name = self.get_key_name(key)
            action = {
                'type': 'Keyboard',
                'action': 'Key Release',
                'details': f'Key: {key_name}',
                'timestamp': current_time - self.start_time,
                'delay': current_time - self.last_action_time,
                'duration': 0,
                'position': ''
            }
            self.last_action_time = current_time
            self.actions.append(action)
            self.action_recorded.emit(action)
            
    def get_key_name(self, key):
        try:
            return key.char if hasattr(key, 'char') and key.char else str(key).replace('Key.', '')
        except:
            return str(key).replace('Key.', '')

class StatWidget(QFrame):
    def __init__(self, value, label):
        super().__init__()
        self.setFrameStyle(QFrame.Box)
        self.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, 
                    stop:0 #1e1315, stop:1 #311d20);
                border: 1px solid #623c4a;
                border-radius: 15px;
                padding: 10px;
            }
        """)
        
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignCenter)
        
        self.value_label = QLabel(str(value))
        self.value_label.setAlignment(Qt.AlignCenter)
        self.value_label.setStyleSheet("""
            QLabel {
                font-size: 24px;
                font-weight: bold;
                color: #d52f67;
                background: transparent;
                border: none;
            }
        """)
        
        self.text_label = QLabel(label)
        self.text_label.setAlignment(Qt.AlignCenter)
        self.text_label.setStyleSheet("""
            QLabel {
                font-size: 12px;
                color: #e7c4c4;
                background: transparent;
                border: none;
            }
        """)
        
        layout.addWidget(self.value_label)
        layout.addWidget(self.text_label)
        self.setLayout(layout)
        
    def update_value(self, value):
        self.value_label.setText(str(value))

class MacroRecorderApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.recorder = MacroRecorder()
        self.recorder.action_recorded.connect(self.add_action_to_table)
        
        self.total_actions = 0
        self.recording_duration = 0.0
        self.keystrokes = 0
        self.mouse_actions = 0
        self.recording_start_time = None
        
        self.setup_ui()
        self.setup_timer()
        self.apply_dark_theme()
        
    def setup_ui(self):
        self.setWindowTitle("Macro Recorder")
        self.setMinimumSize(1200, 800)
        self.resize(1400, 900)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)
        
        # Header
        header = self.create_header()
        main_layout.addWidget(header)
        
        # Table
        self.create_table()
        main_layout.addWidget(self.table)
        
    def create_header(self):
        header = QFrame()
        header.setFrameStyle(QFrame.Box)
        header.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, 
                    stop:0 #110c0f, stop:1 #2b1c27);
                border: 1px solid #623c4a;
                border-radius: 15px;
                padding: 20px;
            }
        """)
        
        layout = QHBoxLayout(header)
        
        # Title
        title_layout = QHBoxLayout()
        title_icon = QLabel("♪")  # Using a music note as icon
        title_icon.setStyleSheet("font-size: 28px; color: #d52f67; font-weight: bold;")
        title_text = QLabel("Macro Recorder")
        title_text.setStyleSheet("font-size: 24px; font-weight: bold; color: #dddbd1;")
        title_layout.addWidget(title_icon)
        title_layout.addWidget(title_text)
        title_layout.addStretch()
        
        # Stats
        stats_layout = QHBoxLayout()
        self.total_actions_stat = StatWidget(0, "Total Actions")
        self.duration_stat = StatWidget("0.0s", "Duration")
        self.keystrokes_stat = StatWidget(0, "Keystrokes")
        self.mouse_actions_stat = StatWidget(0, "Mouse Actions")
        
        stats_layout.addWidget(self.total_actions_stat)
        stats_layout.addWidget(self.duration_stat)
        stats_layout.addWidget(self.keystrokes_stat)
        stats_layout.addWidget(self.mouse_actions_stat)
        
        # Controls
        controls_layout = QHBoxLayout()
        
        # Status
        self.status_frame = QFrame()
        self.status_frame.setStyleSheet("""
            QFrame {
                background: #2b1c27;
                border: 1px solid #623c4a;
                border-radius: 8px;
                padding: 8px 16px;
            }
        """)
        status_layout = QHBoxLayout(self.status_frame)
        self.status_indicator = QLabel("●")
        self.status_indicator.setStyleSheet("color: #e7c4c4; font-size: 12px;")
        self.status_text = QLabel("Ready")
        self.status_text.setStyleSheet("color: #dddbd1; font-size: 14px;")
        status_layout.addWidget(self.status_indicator)
        status_layout.addWidget(self.status_text)
        
        # Buttons
        self.record_btn = QPushButton("▶ Start Recording")
        self.record_btn.setStyleSheet("""
            QPushButton {
                background: #4caf50;
                border: none;
                color: #dddbd1;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background: #d5688b;
                transform: translateY(-2px);
            }
        """)
        self.record_btn.clicked.connect(self.toggle_recording)
        
        self.pause_btn = QPushButton("⏸")
        self.pause_btn.setEnabled(False)
        self.pause_btn.clicked.connect(self.pause_recording)
        
        self.stop_btn = QPushButton("⏹")
        self.stop_btn.setEnabled(False)
        self.stop_btn.clicked.connect(self.stop_recording)
        
        self.clear_btn = QPushButton("🗑")
        self.clear_btn.clicked.connect(self.clear_actions)
        
        self.save_btn = QPushButton("💾")
        self.save_btn.clicked.connect(self.save_macro)
        
        # Style control buttons
        control_btn_style = """
            QPushButton {
                background: #2b1c27;
                border: 1px solid #623c4a;
                color: #e7c4c4;
                padding: 12px;
                border-radius: 8px;
                font-size: 16px;
                min-width: 48px;
                max-width: 48px;
                min-height: 48px;
                max-height: 48px;
            }
            QPushButton:hover {
                color: #dddbd1;
                background: #110c0f;
            }
            QPushButton:disabled {
                opacity: 0.5;
            }
        """
        
        for btn in [self.pause_btn, self.stop_btn, self.clear_btn, self.save_btn]:
            btn.setStyleSheet(control_btn_style)
        
        controls_layout.addWidget(self.status_frame)
        controls_layout.addWidget(self.record_btn)
        controls_layout.addWidget(self.pause_btn)
        controls_layout.addWidget(self.stop_btn)
        controls_layout.addWidget(self.clear_btn)
        controls_layout.addWidget(self.save_btn)
        
        layout.addLayout(title_layout)
        layout.addLayout(stats_layout)
        layout.addLayout(controls_layout)
        
        return header
        
    def create_table(self):
        self.table = QTableWidget()
        self.table.setColumnCount(9)
        headers = ["#", "Type", "Action", "Details", "Timestamp", "Delay", "Duration", "Position", "⚙"]
        self.table.setHorizontalHeaderLabels(headers)
        
        # Set column widths
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Fixed)
        header.setSectionResizeMode(1, QHeaderView.Fixed)
        header.setSectionResizeMode(2, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.Stretch)
        header.setSectionResizeMode(4, QHeaderView.Fixed)
        header.setSectionResizeMode(5, QHeaderView.Fixed)
        header.setSectionResizeMode(6, QHeaderView.Fixed)
        header.setSectionResizeMode(7, QHeaderView.Fixed)
        header.setSectionResizeMode(8, QHeaderView.Fixed)
        
        self.table.setColumnWidth(0, 60)
        self.table.setColumnWidth(1, 120)
        self.table.setColumnWidth(4, 120)
        self.table.setColumnWidth(5, 100)
        self.table.setColumnWidth(6, 100)
        self.table.setColumnWidth(7, 150)
        self.table.setColumnWidth(8, 50)
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setAlternatingRowColors(True)
        
        # Add empty state
        self.add_empty_state()
        
    def add_empty_state(self):
        self.table.setRowCount(1)
        empty_item = QTableWidgetItem("No actions recorded yet\nClick 'Start Recording' to begin capturing keystrokes and mouse movements")
        empty_item.setTextAlignment(Qt.AlignCenter)
        self.table.setItem(0, 0, empty_item)
        self.table.setSpan(0, 0, 1, 9)
        
    def add_action_to_table(self, action):
        if self.table.rowCount() == 1 and self.table.item(0, 0).text().startswith("No actions"):
            self.table.setRowCount(0)
            
        row = self.table.rowCount()
        self.table.insertRow(row)
        
        # Add row number
        self.table.setItem(row, 0, QTableWidgetItem(str(row + 1)))
        
        # Add type with icon
        type_item = QTableWidgetItem(action['type'])
        if action['type'] == 'Keyboard':
            type_item.setForeground(QColor('#4caf50'))
        else:
            type_item.setForeground(QColor('#2196f3'))
        self.table.setItem(row, 1, type_item)
        
        # Add other columns
        self.table.setItem(row, 2, QTableWidgetItem(action['action']))
        self.table.setItem(row, 3, QTableWidgetItem(action['details']))
        self.table.setItem(row, 4, QTableWidgetItem(f"{action['timestamp']:.3f}s"))
        self.table.setItem(row, 5, QTableWidgetItem(f"{action['delay']:.3f}s"))
        self.table.setItem(row, 6, QTableWidgetItem(f"{action['duration']:.3f}s"))
        self.table.setItem(row, 7, QTableWidgetItem(action['position']))
        
        # Add delete button
        delete_btn = QPushButton("🗑")
        delete_btn.setStyleSheet("""
            QPushButton {
                background: #2b1c27;
                border: 1px solid #623c4a;
                color: #ff4444;
                border-radius: 19px;
                font-size: 12px;
                min-width: 38px;
                max-width: 38px;
                min-height: 38px;
                max-height: 38px;
            }
            QPushButton:hover {
                background: #ff4444;
                color: #dddbd1;
            }
        """)
        delete_btn.clicked.connect(lambda: self.delete_row(row))
        self.table.setCellWidget(row, 8, delete_btn)
        
        # Update stats
        self.total_actions += 1
        if action['type'] == 'Keyboard':
            self.keystrokes += 1
        else:
            self.mouse_actions += 1
            
        self.update_stats()
        
        # Scroll to bottom
        self.table.scrollToBottom()
        
    def delete_row(self, row):
        if row < self.table.rowCount():
            self.table.removeRow(row)
            self.total_actions -= 1
            self.update_stats()
            
            if self.table.rowCount() == 0:
                self.add_empty_state()
                
    def setup_timer(self):
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_duration)
        
    def toggle_recording(self):
        if not self.recorder.recording:
            self.start_recording()
        else:
            self.stop_recording()
            
    def start_recording(self):
        self.recorder.start_recording()
        self.recording_start_time = time.time()
        
        self.record_btn.setText("⏹ Stop Recording")
        self.record_btn.setStyleSheet("""
            QPushButton {
                background: #ff4444;
                border: none;
                color: #dddbd1;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
                animation: pulse 2s infinite;
            }
            QPushButton:hover {
                background: #ff6666;
            }
        """)
        
        self.pause_btn.setEnabled(True)
        self.stop_btn.setEnabled(True)
        
        self.status_indicator.setStyleSheet("color: #ff4444; font-size: 12px;")
        self.status_text.setText("Recording")
        
        self.timer.start(100)  # Update every 100ms
        
    def pause_recording(self):
        self.recorder.pause_recording()
        if self.recorder.paused:
            self.status_text.setText("Paused")
            self.timer.stop()
        else:
            self.status_text.setText("Recording")
            self.timer.start(100)
            
    def stop_recording(self):
        self.recorder.stop_recording()
        self.timer.stop()
        
        self.record_btn.setText("▶ Start Recording")
        self.record_btn.setStyleSheet("""
            QPushButton {
                background: #4caf50;
                border: none;
                color: #dddbd1;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background: #d5688b;
            }
        """)
        
        self.pause_btn.setEnabled(False)
        self.stop_btn.setEnabled(False)
        
        self.status_indicator.setStyleSheet("color: #e7c4c4; font-size: 12px;")
        self.status_text.setText("Ready")
        
    def clear_actions(self):
        reply = QMessageBox.question(self, 'Clear Actions', 
                                   'Are you sure you want to clear all recorded actions?',
                                   QMessageBox.Yes | QMessageBox.No, 
                                   QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            self.table.setRowCount(0)
            self.add_empty_state()
            self.total_actions = 0
            self.keystrokes = 0
            self.mouse_actions = 0
            self.recording_duration = 0.0
            self.update_stats()
            
    def save_macro(self):
        if self.total_actions == 0:
            QMessageBox.information(self, 'No Actions', 'No actions to save. Record some actions first.')
            return
            
        filename, _ = QFileDialog.getSaveFileName(self, 'Save Macro', '', 'JSON files (*.json)')
        if filename:
            try:
                data = {
                    'actions': self.recorder.actions,
                    'total_actions': self.total_actions,
                    'duration': self.recording_duration,
                    'keystrokes': self.keystrokes,
                    'mouse_actions': self.mouse_actions,
                    'created': datetime.now().isoformat()
                }
                with open(filename, 'w') as f:
                    json.dump(data, f, indent=2)
                QMessageBox.information(self, 'Saved', f'Macro saved to {filename}')
            except Exception as e:
                QMessageBox.critical(self, 'Error', f'Failed to save macro: {str(e)}')
                
    def update_duration(self):
        if self.recording_start_time:
            self.recording_duration = time.time() - self.recording_start_time
            self.update_stats()
            
    def update_stats(self):
        self.total_actions_stat.update_value(self.total_actions)
        self.duration_stat.update_value(f"{self.recording_duration:.1f}s")
        self.keystrokes_stat.update_value(self.keystrokes)
        self.mouse_actions_stat.update_value(self.mouse_actions)
        
    def apply_dark_theme(self):
        self.setStyleSheet("""
            QMainWindow {
                background: qradialgradient(cx:0.5, cy:0.5, radius:1, 
                    stop:0 #110c0f, stop:1 #2b1c27);
                color: #dddbd1;
            }
            QTableWidget {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, 
                    stop:0 #110c0f, stop:1 transparent);
                border: 1px solid #623c4a;
                border-radius: 15px;
                gridline-color: #623c4a;
                color: #dddbd1;
                selection-background-color: #623c4a;
            }
            QTableWidget::item {
                padding: 12px;
                border-bottom: 1px solid #623c4a;
            }
            QTableWidget::item:selected {
                background-color: #623c4a;
            }
            QTableWidget::item:hover {
                background-color: rgba(98, 60, 74, 0.5);
            }
            QHeaderView::section {
                background: #2b1c27;
                color: #e7c4c4;
                padding: 16px;
                border: 1px solid #623c4a;
                font-weight: bold;
            }
            QScrollBar:vertical {
                background: #311d20;
                width: 8px;
                border-radius: 4px;
            }
            QScrollBar::handle:vertical {
                background: #623c4a;
                border-radius: 4px;
            }
            QScrollBar::handle:vertical:hover {
                background: #d5688b;
            }
        """)

def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # Use Fusion style for better dark theme support
    
    # Set application properties
    app.setApplicationName("Macro Recorder")
    app.setApplicationVersion("1.0")
    
    window = MacroRecorderApp()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()