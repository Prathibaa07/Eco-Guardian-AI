import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid

import database as db
import ibm_ai as ai

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
CORS(app)  # Enable Cross-Origin Resource Sharing

# Configurations
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "ecoguardian-local-jwt-secret-key-12345")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# =====================================================================
# Serve React Frontend (SPA catch-all)
# =====================================================================
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # If the path corresponds to a real file in dist, serve it
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Otherwise serve index.html (React Router handles client-side routing)
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"status": "EcoGuardian AI API running. Frontend not built yet."}), 200

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "database_mode": "Supabase" if db.USE_SUPABASE else "Local SQLite",
        "ai_service_mode": ai.AI_SERVICE
    })

# Serve uploaded images locally
@app.route("/api/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# =====================================================================
# Authentication Endpoints (Simulated + Supabase Integrations)
# =====================================================================
@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    data = request.json
    email = data.get("email")
    password = data.get("password")  # Mock auth, not hashing for local development demo
    full_name = data.get("full_name", "Eco Citizen")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    # Generate mock UID if not using Supabase
    uid = str(uuid.uuid4())
    user = db.create_user(uid, email, full_name)
    return jsonify({
        "message": "User registered successfully",
        "user": user
    })

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.json
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    # In mock mode, log in any user, creating them if they don't exist
    # If they exist, return profile. Otherwise, create user.
    conn = db.get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    
    if user_row:
        user = dict(user_row)
    else:
        uid = str(uuid.uuid4())
        full_name = email.split("@")[0].capitalize()
        user = db.create_user(uid, email, full_name)
        
    return jsonify({
        "message": "Login successful",
        "user": user
    })

@app.route("/api/users/<user_id>", methods=["GET"])
def get_user(user_id):
    profile = db.get_user_profile(user_id)
    if not profile:
        return jsonify({"error": "User profile not found"}), 404
    return jsonify(profile)


# =====================================================================
# Issue Reporting & Feed
# =====================================================================
@app.route("/api/reports", methods=["POST"])
def create_issue_report():
    # Handle image upload
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400
        
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file format"}), 400
        
    # Form details
    title = request.form.get("title", "Environmental Issue")
    description = request.form.get("description", "")
    latitude_str = request.form.get("latitude")
    longitude_str = request.form.get("longitude")
    user_id = request.form.get("user_id")
    manual_category = request.form.get("category")
    manual_severity = request.form.get("severity")

    if not latitude_str or not longitude_str:
        return jsonify({"error": "Coordinates (latitude and longitude) are required"}), 400
        
    try:
        latitude = float(latitude_str)
        longitude = float(longitude_str)
    except ValueError:
        return jsonify({"error": "Invalid coordinates format"}), 400

    # Save image locally
    filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
    local_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(local_path)
    
    # Image URL returned to frontend
    image_url = f"/api/uploads/{filename}"
    
    # Analyze Image using AI (either Gemini, Watsonx, or simulated fallback)
    # Read bytes for API calls
    with open(local_path, "rb") as f:
        image_bytes = f.read()
        
    try:
        analysis = ai.analyze_environmental_issue(image_bytes, description)
    except Exception as e:
        print(f"Error executing AI analysis: {e}")
        # Fallback
        analysis = {
            "title": title,
            "category": "Other Environmental Issues",
            "severity": "Medium",
            "priority_score": "Medium",
            "environmental_impact": "Issue requiring review. Could affect safety or waste management.",
            "recommended_solutions": ["Deploy an inspector", "Review community feedback"]
        }
        
    ai_category = analysis.get("category", "Other Environmental Issues")
    
    # Mismatch Check: Enforce AI categorization, unless AI is unsure ("Other Environmental Issues")
    if manual_category and ai_category and manual_category != ai_category and ai_category != "Other Environmental Issues":
        return jsonify({
            "error": f"Gemini analyzed your photo and detected '{ai_category}'. Please select '{ai_category}' as the category to proceed."
        }), 400

    # Save Report details to DB
    report_data = {
        "user_id": user_id,
        "title": analysis.get("title", title),
        "description": description,
        "image_url": image_url,
        "latitude": latitude,
        "longitude": longitude,
        "category": manual_category if manual_category else analysis.get("category", "Other Environmental Issues"),
        "severity": manual_severity if manual_severity else analysis.get("severity", "Medium"),
        "priority_score": analysis.get("priority_score", "Medium"),
        "environmental_impact": analysis.get("environmental_impact", ""),
        "recommended_solutions": analysis.get("recommended_solutions", [])
    }
    
    saved_report = db.create_report(report_data)
    return jsonify(saved_report), 201

@app.route("/api/reports", methods=["GET"])
def get_reports_list():
    category = request.args.get("category", "All")
    severity = request.args.get("severity", "All")
    status = request.args.get("status", "All")
    
    reports = db.get_reports(category, severity, status)
    return jsonify(reports)

@app.route("/api/reports/<report_id>", methods=["GET"])
def get_single_report(report_id):
    report = db.get_report_by_id(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    return jsonify(report)

@app.route("/api/reports/<report_id>", methods=["DELETE"])
def delete_issue_report(report_id):
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
        
    success = db.delete_report(report_id, user_id)
    if success:
        return jsonify({"message": "Report deleted successfully"})
    return jsonify({"error": "Failed to delete report. It may not exist or you don't have permission."}), 403

@app.route("/api/reports/<report_id>/resolve", methods=["POST"])
def resolve_issue(report_id):
    description = request.form.get("description", "")
    user_id = request.form.get("user_id")
    
    if "image" not in request.files:
        resolution_image_url = None
    else:
        file = request.files["image"]
        if file.filename != "" and allowed_file(file.filename):
            filename = secure_filename(f"resolved_{uuid.uuid4()}_{file.filename}")
            local_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(local_path)
            resolution_image_url = f"/api/uploads/{filename}"
        else:
            resolution_image_url = None
            
    success = db.resolve_report(report_id, resolution_image_url, description, user_id)
    if success:
        return jsonify({"message": "Issue resolved successfully", "status": "Resolved"})
    return jsonify({"error": "Failed to resolve report"}), 500


# =====================================================================
# Dashboard & Eco Scores
# =====================================================================
@app.route("/api/dashboard/stats", methods=["GET"])
def get_stats():
    stats = db.get_dashboard_stats()
    return jsonify(stats)

@app.route("/api/dashboard/monthly-trends", methods=["GET"])
def get_trends():
    trends = db.get_monthly_trends()
    return jsonify(trends)

@app.route("/api/zones", methods=["GET"])
def get_zones_eco_scores():
    scores = db.get_all_eco_scores()
    return jsonify(scores)

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard_data():
    leaderboard = db.get_leaderboard()
    return jsonify(leaderboard)


# =====================================================================
# EcoBot Chat Assistant
# =====================================================================
@app.route("/api/ecobot/chat", methods=["POST"])
def ecobot_chat():
    data = request.json
    if not data:
        return jsonify({"error": "Missing payload"}), 400
        
    chat_history = data.get("chat_history", [])
    user_message = data.get("message")
    
    if not user_message:
        return jsonify({"error": "Message is required"}), 400
        
    bot_response = ai.get_ecobot_response(chat_history, user_message)
    return jsonify({
        "response": bot_response
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    # Run the Flask app on 0.0.0.0 to enable local network accessibility
    app.run(host="0.0.0.0", port=port, debug=True)
