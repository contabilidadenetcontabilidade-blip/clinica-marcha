# Marcha Cup 🏆 - Documentation

## Overview
The "Marcha Cup" is a gamified House System integrated into the Clínica Marcha platform. Students are assigned to houses and earn points based on performance and attendance.

## Features
1.  **House System**:
    -   5 Official Houses: Reformer (Green), Cadillac (Purple), Barrel (Red), Chair (Orange), Tower (Blue).
    -   Each House has a crest, color, and dynamic score.

2.  **Ranking**:
    -   Public Leaderboard: `http://localhost:8080/ranking.html`
    -   Real-time point calculation from the `scores` table.

3.  **Student Portal**:
    -   Personal Dashboard: `http://localhost:8080/portal_aluno.html`
    -   Displays Student's House, Total Points, and recent History.
    -   Secured access via Login.

## Technical Details
-   **Database**: 
    -   New tables: `houses`, `athletes` (links patient to house), `scoring_rules`, `scores`.
    -   Legacy `patients` table is preserved.
-   **API Endpoints**:
    -   `GET /api/ranking`: Returns house hierarchy.
    -   `GET /api/student-portal/:id`: Returns full student profile + stats.
    -   `POST /api/patients/:id/house`: Assigns a student to a house.

## How to Assign a Student manually (for Admin)
Use the API (Postman/Curl) or future Admin UI:
`PUT /api/patients/:id/house`
Body: `{"house_id": 4}`

## Login Credentials (Test)
-   **User**: `aluno.flow2`
-   **Pass**: `123`
-   **Role**: Aluno (Redirects to Portal)

## Icons & Assets
House crests are stored in `backend/assets/houses/`.
