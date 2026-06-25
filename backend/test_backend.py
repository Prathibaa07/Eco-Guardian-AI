import os
import unittest
import json
import sqlite3

# Import our backend components
import database as db
import ibm_ai as ai
import app as flask_app

class TestEcoGuardianBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Override Database to a test SQLite database
        cls.test_db = "test_ecoguardian.db"
        db.DB_FILE = cls.test_db
        db.USE_SUPABASE = False
        db.db_init()
        
    @classmethod
    def tearDownClass(cls):
        # Remove test database file
        if os.path.exists(cls.test_db):
            os.remove(cls.test_db)
            
    def test_database_init(self):
        """Verify that tables are created successfully."""
        conn = sqlite3.connect(self.test_db)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        self.assertIsNotNone(cursor.fetchone())
        
        # Check reports table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reports'")
        self.assertIsNotNone(cursor.fetchone())
        
        conn.close()

    def test_user_operations(self):
        """Test creating user, gaining points, and awarding badges."""
        uid = "test-user-123"
        email = "citizen@ecoguardian.org"
        name = "Eco Champion"
        
        # Create
        user = db.create_user(uid, email, name)
        self.assertEqual(user["id"], uid)
        self.assertEqual(user["email"], email)
        
        # Get Profile
        profile = db.get_user_profile(uid)
        self.assertIsNotNone(profile)
        self.assertEqual(profile["full_name"], name)
        self.assertEqual(profile["points"], 0)
        self.assertEqual(len(profile["badges"]), 0)
        
        # Add points
        new_points = db.update_user_points(uid, 50)
        self.assertEqual(new_points, 50)
        
        # Award badge
        badge = db.award_badge(uid, "First Poster", "Shared your first concern.")
        self.assertEqual(badge["badge_name"], "First Poster")
        
        # Verify points & badge updated
        profile = db.get_user_profile(uid)
        self.assertEqual(profile["points"], 50)
        self.assertEqual(len(profile["badges"]), 1)
        self.assertEqual(profile["badges"][0]["badge_name"], "First Poster")

    def test_ai_analyzer_simulated(self):
        """Verify the fallback simulated analyzer behaves realistically based on text keys."""
        res_plastic = ai._analyze_simulated("We found some plastic bottles in the lake")
        self.assertEqual(res_plastic["category"], "Plastic Waste")
        self.assertEqual(res_plastic["severity"], "Medium")
        self.assertTrue(len(res_plastic["recommended_solutions"]) >= 3)
        
        res_sewage = ai._analyze_simulated("There is stinky sewage overflow on Main street")
        self.assertEqual(res_sewage["category"], "Sewage Overflow")
        self.assertEqual(res_sewage["severity"], "Critical")
        
        res_unknown = ai._analyze_simulated("Unidentified problem on the road")
        self.assertEqual(res_unknown["category"], "Other Environmental Issues")

    def test_reports_and_eco_scores(self):
        """Verify creating reports, listing them, and computing geographical Eco Scores."""
        # Create user
        uid = "test-user-456"
        db.create_user(uid, "tester@test.com", "Tester")
        
        # Issue 1: High severity Air pollution at (40.71, -74.00)
        report_1 = {
            "user_id": uid,
            "title": "Smoke leak",
            "description": "Fumes from industrial chimney",
            "image_url": "/api/uploads/smoke.jpg",
            "latitude": 40.712,
            "longitude": -74.006,
            "category": "Air Pollution",
            "severity": "High",
            "priority_score": "High",
            "environmental_impact": "Severe air quality degradation.",
            "recommended_solutions": ["Install filters", "Inspect exhaust"]
        }
        saved_1 = db.create_report(report_1)
        self.assertIsNotNone(saved_1["id"])
        
        # Issue 2: Medium severity Water Leakage at same zone (40.71, -74.01) -> rounds to (40.71, -74.01)
        report_2 = {
            "user_id": uid,
            "title": "Leaking pipe",
            "description": "Water run out of valve",
            "image_url": "/api/uploads/water.jpg",
            "latitude": 40.714,
            "longitude": -74.011,
            "category": "Water Leakage",
            "severity": "Medium",
            "priority_score": "Medium",
            "environmental_impact": "Clean water wasting.",
            "recommended_solutions": ["Fix valve"]
        }
        saved_2 = db.create_report(report_2)
        
        # Fetch reports
        reports = db.get_reports()
        self.assertEqual(len(reports), 2)
        
        # Eco scores
        scores = db.get_all_eco_scores()
        # Since reports are very close, they might group together.
        # lat1 = 40.71, lon1 = -74.01. lat2 = 40.71, lon2 = -74.01.
        # They should fall under the same key: "40.71,-74.01"
        self.assertEqual(len(scores), 1)
        # High severity penalty: -15, Medium severity penalty: -8. Total penalty = -23. Eco score = 100 - 23 = 77.
        self.assertEqual(scores[0]["eco_score"], 77)
        self.assertEqual(scores[0]["active_reports"], 2)
        
        # Resolve one report
        db.resolve_report(saved_1["id"], "/api/uploads/resolved.jpg", "Fixed chimney filter", uid)
        
        # Recalculate Eco Score (High severity resolved, only Medium left active: -8. Eco score = 100 - 8 = 92.)
        scores_after = db.get_all_eco_scores()
        self.assertEqual(scores_after[0]["eco_score"], 92)
        self.assertEqual(scores_after[0]["active_reports"], 1)
        self.assertEqual(scores_after[0]["resolved_reports"], 1)

if __name__ == "__main__":
    unittest.main()
