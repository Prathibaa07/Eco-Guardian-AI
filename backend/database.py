import os
import sqlite3
import uuid
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check if Supabase credentials are set
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)
DB_FILE = os.path.join(os.path.dirname(__file__), "ecoguardian.db")

supabase_client = None
if USE_SUPABASE:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase successfully!")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}. Falling back to SQLite.")
        USE_SUPABASE = False

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def db_init():
    """Initializes the database schema if running in local SQLite mode."""
    if USE_SUPABASE:
        print("Using Supabase. Database tables should be configured in the Supabase Dashboard.")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create Reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        priority_score TEXT NOT NULL,
        environmental_impact TEXT,
        recommended_solutions TEXT, -- stored as JSON string
        status TEXT DEFAULT 'Active',
        resolution_image_url TEXT,
        resolution_description TEXT,
        resolved_by TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # Create Badges table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS badges (
        user_id TEXT,
        badge_name TEXT NOT NULL,
        description TEXT NOT NULL,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_name),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    conn.commit()
    conn.close()
    print("Local SQLite Database initialized successfully!")

# Ensure DB is initialized
db_init()


# User Operations
def create_user(user_id, email, full_name):
    if USE_SUPABASE:
        try:
            data = {"id": user_id, "email": email, "full_name": full_name, "points": 0}
            res = supabase_client.table("users").upsert(data).execute()
            return data
        except Exception as e:
            print(f"Supabase create_user error: {e}")
    
    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO users (id, email, full_name, points) VALUES (?, ?, ?, ?)",
            (user_id, email, full_name, 0)
        )
        conn.commit()
    except Exception as e:
        print(f"SQLite create_user error: {e}")
    finally:
        conn.close()
    return {"id": user_id, "email": email, "full_name": full_name, "points": 0}

def get_user_profile(user_id):
    if USE_SUPABASE:
        try:
            res = supabase_client.table("users").select("*").eq("id", user_id).execute()
            user_data = res.data[0] if res.data else None
            if user_data:
                # Fetch badges
                badge_res = supabase_client.table("badges").select("*").eq("user_id", user_id).execute()
                user_data["badges"] = badge_res.data
                return user_data
        except Exception as e:
            print(f"Supabase get_user_profile error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return None
    
    user_dict = dict(user)
    badges = cursor.execute("SELECT badge_name, description, awarded_at FROM badges WHERE user_id = ?", (user_id,)).fetchall()
    user_dict["badges"] = [dict(b) for b in badges]
    conn.close()
    return user_dict

def update_user_points(user_id, points_to_add):
    if USE_SUPABASE:
        try:
            # First fetch current points
            res = supabase_client.table("users").select("points").eq("id", user_id).execute()
            current_points = res.data[0]["points"] if res.data else 0
            new_points = current_points + points_to_add
            supabase_client.table("users").update({"points": new_points}).eq("id", user_id).execute()
            return new_points
        except Exception as e:
            print(f"Supabase update_user_points error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET points = points + ? WHERE id = ?", (points_to_add, user_id))
    conn.commit()
    user = cursor.execute("SELECT points FROM users WHERE id = ?", (user_id,)).fetchone()
    points = user["points"] if user else 0
    conn.close()
    return points

def award_badge(user_id, badge_name, description):
    if USE_SUPABASE:
        try:
            data = {"user_id": user_id, "badge_name": badge_name, "description": description}
            supabase_client.table("badges").upsert(data).execute()
            return data
        except Exception as e:
            print(f"Supabase award_badge error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO badges (user_id, badge_name, description) VALUES (?, ?, ?)",
            (user_id, badge_name, description)
        )
        conn.commit()
    except Exception as e:
        print(f"SQLite award_badge error: {e}")
    finally:
        conn.close()
    return {"user_id": user_id, "badge_name": badge_name, "description": description}


# Report Operations
def create_report(report_data):
    report_id = str(uuid.uuid4())
    report_data["id"] = report_id
    report_data["status"] = "Active"
    report_data["created_at"] = datetime.utcnow().isoformat()
    
    # Store solutions as string in DB
    solutions_raw = report_data.get("recommended_solutions", [])
    solutions_str = json.dumps(solutions_raw) if isinstance(solutions_raw, list) else json.dumps([])

    if USE_SUPABASE:
        try:
            supabase_data = {
                "id": report_id,
                "user_id": report_data.get("user_id"),
                "title": report_data.get("title"),
                "description": report_data.get("description"),
                "image_url": report_data.get("image_url"),
                "latitude": report_data.get("latitude"),
                "longitude": report_data.get("longitude"),
                "category": report_data.get("category"),
                "severity": report_data.get("severity"),
                "priority_score": report_data.get("priority_score"),
                "environmental_impact": report_data.get("environmental_impact"),
                "recommended_solutions": solutions_str,
                "status": "Active"
            }
            supabase_client.table("reports").insert(supabase_data).execute()
            # Reward reporting points (+50 points)
            if report_data.get("user_id"):
                update_user_points(report_data["user_id"], 50)
                # Check for first report badge
                award_badge(report_data["user_id"], "Eco Sentinel", "Submitted your very first environmental issue report.")
                
                # Check for category specific badges
                category = report_data.get("category")
                if "Plastic" in category:
                    award_badge(report_data["user_id"], "Plastbuster", "Reported a plastic waste issue.")
                elif "Water" in category:
                    award_badge(report_data["user_id"], "Water Defender", "Reported a water pollution or leakage issue.")
            return report_data
        except Exception as e:
            print(f"Supabase create_report error: {e}. Falling back to SQLite.")

    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reports (
            id, user_id, title, description, image_url, latitude, longitude, 
            category, severity, priority_score, environmental_impact, recommended_solutions, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_id,
        report_data.get("user_id"),
        report_data.get("title"),
        report_data.get("description"),
        report_data.get("image_url"),
        report_data.get("latitude"),
        report_data.get("longitude"),
        report_data.get("category"),
        report_data.get("severity"),
        report_data.get("priority_score"),
        report_data.get("environmental_impact"),
        solutions_str,
        "Active"
    ))
    conn.commit()
    conn.close()

    # Reward reporting points (+50 points)
    if report_data.get("user_id"):
        update_user_points(report_data["user_id"], 50)
        # Badges award logic
        award_badge(report_data["user_id"], "Eco Sentinel", "Submitted your very first environmental issue report.")
        category = report_data.get("category")
        if "Plastic" in category:
            award_badge(report_data["user_id"], "Plastbuster", "Reported a plastic waste issue.")
        elif "Water" in category:
            award_badge(report_data["user_id"], "Water Defender", "Reported a water pollution or leakage issue.")

        # Count total reports for multi-report badges
        conn = get_db_connection()
        report_count = conn.execute("SELECT COUNT(*) FROM reports WHERE user_id = ?", (report_data["user_id"],)).fetchone()[0]
        conn.close()
        if report_count >= 5:
            award_badge(report_data["user_id"], "Green Inspector", "Submitted 5 environmental issue reports.")
        if report_count >= 10:
            award_badge(report_data["user_id"], "Nature Savior", "Submitted 10 environmental issue reports.")

    return report_data

def get_reports(category=None, severity=None, status=None):
    if USE_SUPABASE:
        try:
            query = supabase_client.table("reports").select("*")
            if category and category != "All":
                query = query.eq("category", category)
            if severity and severity != "All":
                query = query.eq("severity", severity)
            if status and status != "All":
                query = query.eq("status", status)
            res = query.order("created_at", desc=True).execute()
            reports_list = []
            for r in res.data:
                r_dict = dict(r)
                try:
                    r_dict["recommended_solutions"] = json.loads(r_dict["recommended_solutions"])
                except Exception:
                    r_dict["recommended_solutions"] = []
                reports_list.append(r_dict)
            return reports_list
        except Exception as e:
            print(f"Supabase get_reports error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    query = "SELECT r.*, u.full_name as reporter_name FROM reports r LEFT JOIN users u ON r.user_id = u.id WHERE 1=1"
    params = []
    if category and category != "All":
        query += " AND r.category = ?"
        params.append(category)
    if severity and severity != "All":
        query += " AND r.severity = ?"
        params.append(severity)
    if status and status != "All":
        query += " AND r.status = ?"
        params.append(status)
    
    query += " ORDER BY r.created_at DESC"
    
    rows = conn.execute(query, params).fetchall()
    reports_list = []
    for row in rows:
        r_dict = dict(row)
        try:
            r_dict["recommended_solutions"] = json.loads(r_dict["recommended_solutions"])
        except Exception:
            r_dict["recommended_solutions"] = []
        reports_list.append(r_dict)
    conn.close()
    return reports_list

def get_report_by_id(report_id):
    if USE_SUPABASE:
        try:
            res = supabase_client.table("reports").select("*").eq("id", report_id).execute()
            if res.data:
                r_dict = dict(res.data[0])
                try:
                    r_dict["recommended_solutions"] = json.loads(r_dict["recommended_solutions"])
                except Exception:
                    r_dict["recommended_solutions"] = []
                return r_dict
        except Exception as e:
            print(f"Supabase get_report_by_id error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    row = conn.execute("SELECT r.*, u.full_name as reporter_name, u.email as reporter_email FROM reports r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?", (report_id,)).fetchone()
    conn.close()
    if row:
        r_dict = dict(row)
        try:
            r_dict["recommended_solutions"] = json.loads(r_dict["recommended_solutions"])
        except Exception:
            r_dict["recommended_solutions"] = []
        return r_dict
    return None

def resolve_report(report_id, resolution_image_url, resolution_description, user_id):
    resolved_at = datetime.utcnow().isoformat()
    if USE_SUPABASE:
        try:
            update_data = {
                "status": "Resolved",
                "resolution_image_url": resolution_image_url,
                "resolution_description": resolution_description,
                "resolved_by": user_id,
                "resolved_at": resolved_at
            }
            supabase_client.table("reports").update(update_data).eq("id", report_id).execute()
            # Reward solving user (+100 points)
            if user_id:
                update_user_points(user_id, 100)
                award_badge(user_id, "Zero Waste Hero", "Resolved an environmental issue.")
            return True
        except Exception as e:
            print(f"Supabase resolve_report error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE reports 
        SET status = 'Resolved', 
            resolution_image_url = ?, 
            resolution_description = ?, 
            resolved_by = ?, 
            resolved_at = ? 
        WHERE id = ?
    """, (resolution_image_url, resolution_description, user_id, resolved_at, report_id))
    conn.commit()
    conn.close()

    # Reward solving user (+100 points)
    if user_id:
        update_user_points(user_id, 100)
        award_badge(user_id, "Zero Waste Hero", "Resolved an environmental issue.")
    return True

def delete_report(report_id, user_id):
    if USE_SUPABASE:
        try:
            res = supabase_client.table("reports").delete().match({"id": report_id, "user_id": user_id}).execute()
            if len(res.data) > 0:
                return True
            return False
        except Exception as e:
            print(f"Supabase delete_report error: {e}")
            return False

    # SQLite fallback
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reports WHERE id = ? AND user_id = ?", (report_id, user_id))
    changes = cursor.rowcount
    conn.commit()
    conn.close()
    return changes > 0


# Leaderboard and Stats
def get_leaderboard():
    if USE_SUPABASE:
        try:
            res = supabase_client.table("users").select("id, email, full_name, points").order("points", desc=True).limit(10).execute()
            return res.data
        except Exception as e:
            print(f"Supabase get_leaderboard error: {e}")

    # SQLite fallback
    conn = get_db_connection()
    rows = conn.execute("SELECT id, email, full_name, points FROM users ORDER BY points DESC LIMIT 10").fetchall()
    leaderboard = [dict(row) for row in rows]
    conn.close()
    return leaderboard

def get_dashboard_stats():
    # Helper to load sqlite rows if we query SQLite or Supabase
    all_reports = get_reports("All", "All", "All")
    
    total_reports = len(all_reports)
    resolved_count = sum(1 for r in all_reports if r["status"] == "Resolved")
    active_count = total_reports - resolved_count
    
    # Category distribution
    categories = {}
    severity_distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for r in all_reports:
        cat = r["category"]
        categories[cat] = categories.get(cat, 0) + 1
        sev = r["severity"]
        if sev in severity_distribution:
            severity_distribution[sev] += 1
            
    category_wise = [{"name": k, "value": v} for k, v in categories.items()]
    
    # Calculate general resolution rate
    res_rate = (resolved_count / total_reports * 100) if total_reports > 0 else 0
    
    return {
        "total_reports": total_reports,
        "resolved_reports": resolved_count,
        "active_reports": active_count,
        "resolution_rate": round(res_rate, 1),
        "category_distribution": category_wise,
        "severity_distribution": severity_distribution
    }

def get_monthly_trends():
    # Returns last 6 months of trends
    # Simply parse timestamps of reports
    reports = get_reports("All", "All", "All")
    
    # Simple formatting of monthly reports
    trends = {}
    for r in reports:
        dt_str = r["created_at"]
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            month_name = dt.strftime("%b %Y")
        except Exception:
            month_name = "Other"
        trends[month_name] = trends.get(month_name, 0) + 1
        
    # Standardize output for recharts
    # Sort or format
    sorted_trends = [{"month": k, "reports": v} for k, v in trends.items()]
    # If empty, give mock history
    if not sorted_trends:
        sorted_trends = [
            {"month": "Jan 2026", "reports": 4},
            {"month": "Feb 2026", "reports": 7},
            {"month": "Mar 2026", "reports": 12},
            {"month": "Apr 2026", "reports": 9},
            {"month": "May 2026", "reports": 15},
            {"month": "Jun 2026", "reports": 22}
        ]
    return sorted_trends


# Eco Score Computations
def get_all_eco_scores():
    """
    Computes sustainability scores for geographical regions.
    Groups coordinates rounded to 2 decimal places (approx. 1.1km grid area).
    A score of 100 starts initially.
    Each active issue incurs penalties based on severity:
      Critical: -25 points
      High: -15 points
      Medium: -8 points
      Low: -3 points
    Capped strictly between 0 and 100.
    """
    reports = get_reports("All", "All", "All")
    zones = {}
    
    for r in reports:
        lat = round(r["latitude"], 2)
        lon = round(r["longitude"], 2)
        zone_key = f"{lat},{lon}"
        
        if zone_key not in zones:
            zones[zone_key] = {
                "latitude": lat,
                "longitude": lon,
                "active_reports": 0,
                "resolved_reports": 0,
                "total_reports": 0,
                "penalty": 0
            }
            
        zones[zone_key]["total_reports"] += 1
        if r["status"] == "Resolved":
            zones[zone_key]["resolved_reports"] += 1
        else:
            zones[zone_key]["active_reports"] += 1
            severity = r["severity"]
            if severity == "Critical":
                zones[zone_key]["penalty"] += 25
            elif severity == "High":
                zones[zone_key]["penalty"] += 15
            elif severity == "Medium":
                zones[zone_key]["penalty"] += 8
            else:
                zones[zone_key]["penalty"] += 3

    result = []
    for key, z in zones.items():
        score = 100 - z["penalty"]
        score = max(0, min(100, score))
        
        result.append({
            "zone": key,
            "latitude": z["latitude"],
            "longitude": z["longitude"],
            "total_reports": z["total_reports"],
            "active_reports": z["active_reports"],
            "resolved_reports": z["resolved_reports"],
            "eco_score": score
        })
        
    return result
