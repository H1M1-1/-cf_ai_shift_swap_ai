#!/bin/bash

# Demo Setup Script for Shift Swap AI
# This script posts sample shifts to demonstrate full AI matching functionality

BASE_URL="${1:-http://localhost:8787}"

echo "🚀 Setting up Shift Swap AI demo..."
echo "📍 Using: $BASE_URL"
echo ""

# Post Shift 1 - Instructor
echo "📝 Posting Shift 1: Alice (Instructor)..."
curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Alice Johnson",
    "role": "Instructor",
    "date": "2025-10-15",
    "shift": "09:00-17:00",
    "notes": "Need coverage for Python fundamentals class"
  }' | jq -r '.id' > /tmp/shift1.txt

echo "✅ Posted: Alice Johnson (Instructor)"
echo ""

# Post Shift 2 - Instructor (good match for Alice)
echo "📝 Posting Shift 2: Bob (Instructor)..."
curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Bob Smith",
    "role": "Instructor",
    "date": "2025-10-16",
    "shift": "09:00-17:00",
    "notes": "Can teach Python, JavaScript, flexible with dates"
  }' | jq -r '.id' > /tmp/shift2.txt

echo "✅ Posted: Bob Smith (Instructor)"
echo ""

# Post Shift 3 - Nurse
echo "📝 Posting Shift 3: Carol (Nurse)..."
curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Carol Williams",
    "role": "Nurse",
    "date": "2025-10-15",
    "shift": "14:00-22:00",
    "notes": "Evening shift, ICU certified"
  }' | jq -r '.id' > /tmp/shift3.txt

echo "✅ Posted: Carol Williams (Nurse)"
echo ""

# Post Shift 4 - Nurse (good match for Carol)
echo "📝 Posting Shift 4: Diana (Nurse)..."
curl -s -X POST "$BASE_URL/api/post" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Diana Prince",
    "role": "Nurse",
    "date": "2025-10-16",
    "shift": "14:00-22:00",
    "notes": "Also ICU certified, prefer evening shifts"
  }' | jq -r '.id' > /tmp/shift4.txt

echo "✅ Posted: Diana Prince (Nurse)"
echo ""

echo "📋 Listing all shifts..."
curl -s "$BASE_URL/api/list" | jq '.[0:4] | .[] | {user: .user, role: .role, date: .date, shift: .shift}'
echo ""

echo "🤖 Testing AI Match for Alice's shift..."
SHIFT1_ID=$(cat /tmp/shift1.txt)
curl -s -X POST "$BASE_URL/api/match" \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"$SHIFT1_ID\"}" | jq '{candidateUser, reason}'

echo ""
echo "✅ Demo setup complete!"
echo ""
echo "🌐 Open your browser to: $BASE_URL"
echo "👀 You should see 4 shifts in the 'Open Shifts' section"
echo "🤖 Click 'Find AI Match' on any shift to see intelligent suggestions"
echo ""
echo "💡 Expected behavior:"
echo "   - Alice ↔ Bob (same role: Instructor, adjacent dates)"
echo "   - Carol ↔ Diana (same role: Nurse, adjacent dates, same time)"
echo ""

# Cleanup temp files
rm -f /tmp/shift*.txt

