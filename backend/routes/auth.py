from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from config.config import config
from datetime import datetime

auth_bp = Blueprint('auth_bp', __name__)

def get_user_by_username(username):
    """Get user from database by username."""
    try:
        conn = sqlite3.connect(config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()
        return user
    except Exception as e:
        print(f"❌ Error fetching user: {e}")
        return None

def create_user(username, password, role='customer'):
    """Create a new user in the database."""
    try:
        conn = sqlite3.connect(config.DATABASE_PATH)
        c = conn.cursor()
        hashed_password = generate_password_hash(password)
        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (username, hashed_password, role)
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False

def update_last_login(username):
    """Update user's last login time."""
    try:
        conn = sqlite3.connect(config.DATABASE_PATH)
        c = conn.cursor()
        c.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?",
            (username,)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"❌ Error updating last login: {e}")

@auth_bp.route('/api/register', methods=['POST'])
@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    confirm_password = data.get('confirmPassword', '').strip()
    role = 'customer'
    
    # Validation
    if not username or len(username) < 3:
        return jsonify({'status': 'error', 'message': 'Username must be at least 3 characters'}), 400
    
    if not password or len(password) < 6:
        return jsonify({'status': 'error', 'message': 'Password must be at least 6 characters'}), 400
    
    if password != confirm_password:
        return jsonify({'status': 'error', 'message': 'Passwords do not match'}), 400
    
    # Check if user already exists
    existing_user = get_user_by_username(username)
    if existing_user:
        return jsonify({'status': 'error', 'message': 'Username already exists'}), 409
    
    # Create user
    if create_user(username, password, role):
        return jsonify({
            'status': 'success',
            'message': 'Registration successful! Please log in.',
            'user': {'username': username, 'role': role}
        }), 201
    else:
        return jsonify({'status': 'error', 'message': 'Registration failed'}), 500

@auth_bp.route('/api/login', methods=['POST'])
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return token."""
    data = request.json
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
    
    # Support both 'username' and 'usernameOrEmail' fields
    username = data.get('username') or data.get('usernameOrEmail') or ''
    username = username.strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'status': 'error', 'message': 'Username and password required'}), 400
    
    # Get user from database
    user = get_user_by_username(username)
    
    if not user:
        # Fallback to demo user for testing
        if username == 'admin' and password == 'admin123@':
            update_last_login('admin')
            return jsonify({
                'status': 'success',
                'token': 'secure_smart_home_token_123',
                'user': {'username': 'admin', 'role': 'admin'}
            }), 200
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    
    # Verify password
    if not check_password_hash(user['password'], password):
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    
    if not user['is_active']:
        return jsonify({'status': 'error', 'message': 'Account is inactive'}), 403
    
    # Update last login
    update_last_login(username)
    
    return jsonify({
        'status': 'success',
        'token': 'secure_smart_home_token_123',
        'user': {'username': user['username'], 'role': user['role']}
    }), 200

@auth_bp.route('/api/auth/users/locked', methods=['GET'])
def get_locked_users():
    """Compatibility endpoint for the frontend security views.

    The current Flask/SQLite backend does not implement account lock tracking,
    so return an empty collection instead of a 404.
    """
    return jsonify({
        'status': 'success',
        'users': []
    }), 200

@auth_bp.route('/api/auth/users/<user_id>/unlock', methods=['PATCH'])
def unlock_user(user_id):
    """Compatibility endpoint for unlock actions from the frontend.

    Since the Flask backend does not persist lock state, acknowledge the action
    so the UI can recover gracefully instead of failing with Not Found.
    """
    return jsonify({
        'status': 'success',
        'message': 'User unlock request accepted.',
        'userId': user_id
    }), 200
