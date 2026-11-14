# 📋 GitHub Project Board: Development Sprints & User Stories

**Project:** Intelligent Location-Based Task Allocation System Using NLP Semantic Matching  
**Student Researcher:** Jan Isaac Mwaniki Maina (166393) — Strathmore University  
**Supervisor:** Dr. Dickson Owuor  
**Repository:** [https://github.com/JanIsaac-1/Intelligent-Task-Allocation-System](https://github.com/JanIsaac-1/Intelligent-Task-Allocation-System)  
**Project Board:** [https://github.com/JanIsaac-1/Intelligent-Task-Allocation-System/projects](https://github.com/JanIsaac-1/Intelligent-Task-Allocation-System/projects)  

---

## 🏗️ Sprint Breakdown & Kanban Board Columns

The development lifecycle was organized across **four two-week Agile Sprints** mapped directly to the technical deliverables in Chapter 4 and Chapter 5 of the project report.

```
+------------------------------------------------------------------------------------------------------------------------+
|                                              GITHUB KANBAN TRACKER BOARD                                               |
+------------------------------------+------------------------------------+----------------------------------------------+
| 📥 TODO / BACKLOG                  | ⚙️ IN PROGRESS                     | ✅ DONE (VERIFIED & CLOSED)                   |
+------------------------------------+------------------------------------+----------------------------------------------+
| • US-10: PWA Offline Sync Cache    | • US-09: Live GPS Breadcrumb Sync  | • US-01: 22-Domain Empirical Dataset Curation|
| • US-11: Voice Task Transcription  | • US-08: Work Shift Auto-Check     | • US-02: Sentence-BERT (MNRL) Fine-Tuning    |
| • US-12: Multi-County Expansion    |                                    | • US-03: PostGIS & Haversine Geodesic Math   |
|                                    |                                    | • US-04: Multi-Criteria MCDM Optimization    |
|                                    |                                    | • US-05: Anti-Burnout Workload Regularization|
|                                    |                                    | • US-06: Hybrid Allocation Leaderboard (UI)  |
|                                    |                                    | • US-07: Work Order Status Categorization    |
|                                    |                                    | • US-13: Security Hardening & Master Passcode|
+------------------------------------+------------------------------------+----------------------------------------------+
```

---

## 📌 Detailed User Story Cards & Deliverables

### ✅ Completed Deliverables (Done Column)

| Issue ID | User Story Title | Deliverable / Component | Story Points | Verification / Test |
| :---: | :--- | :--- | :---: | :--- |
| **#1** | **US-01: Trade Category Dataset** | Curated 2,200 empirical field records across 22 Nairobi trade categories (`Dataset/field_tasks_dataset.json`). | **5** | Verified schema & domain balance. |
| **#2** | **US-02: SBERT Domain Fine-Tuning** | Fine-tuned `all-MiniLM-L6-v2` with Multiple Negatives Ranking Loss (`fine_tuned_kenyan_field_sbert`). | **8** | Model eval benchmark (cosine sim > 0.80 on target domains). |
| **#3** | **US-03: Geodesic Haversine Calculation** | Implemented spherical trigonometric distance calculation bounded within 40 km (`backend/api/allocation.py`). | **3** | `test_haversine_distance_*` (ISO 29119 unit tests passing). |
| **#4** | **US-04: Multi-Criteria Dispatch Engine** | Composite weighting: $S = w_1 S_{\text{skill}} + w_2 S_{\text{prox}} + w_3 S_{\text{work}}$ (`rank_candidates_for_task`). | **8** | `test_ranking_engine_ranks_closer_less_loaded_agent_first` (PASS). |
| **#5** | **US-05: Anti-Burnout Workload Balancer** | Exponential penalty $S_{\text{workload}} = \exp(-\gamma \cdot W_{\text{active}} / W_{\text{capacity}})$. | **5** | Verified zero load scores 1.0, capacity load penalized. |
| **#6** | **US-06: Hybrid Task Allocation Leaderboard** | Top 3 recommendations default view + expandable 22-technician roster + live search (`AllocationModal.tsx`). | **5** | TypeScript Vite build verification & browser dispatch flow. |
| **#7** | **US-07: Work Orders Categorization** | Segmented filter tabs (`All`, `Unallocated`, `Allocated`, `Completed`) + grouped sections (`AdminDashboard.tsx`). | **5** | Real-time state transition from Unallocated to Allocated. |
| **#8** | **US-13: Security & Master Passcode** | Admin approval queue, bcrypt password hashing, and Master Passcode emergency override. | **5** | RBAC authentication endpoint tests passing. |

---

### ⚙️ In Progress Deliverables

| Issue ID | User Story Title | Scope | Story Points | Assigned |
| :---: | :--- | :--- | :---: | :--- |
| **#9** | **US-09: Live GPS Breadcrumb Telemetry** | Simulated background vehicle movement and telemetry logs (`onSimulateGpsMovement`). | **5** | Jan Isaac |
| **#10** | **US-08: Automated Shift Switcher** | Periodic cron/daemon verification of Africa/Nairobi (UTC+3) working hours. | **3** | Jan Isaac |

---

### 📥 Backlog / Future Enhancements (Todo Column)

| Issue ID | User Story Title | Scope | Story Points | Target Milestone |
| :---: | :--- | :--- | :---: | :--- |
| **#11** | **US-10: Offline PWA Service Worker** | IndexedDB local caching for technicians in low-connectivity underground basements. | **8** | Version 2.0 |
| **#12** | **US-11: Swahili Voice-to-Text Transcription** | Whisper / Speech-to-Text audio intake for field reporting. | **8** | Version 2.0 |
| **#13** | **US-12: Multi-County Expansion** | Bounding box expansions for Kiambu, Machakos, and Kajiado counties. | **5** | Version 2.1 |

---

## 🔗 Traceability Matrix to Academic Thesis

- **Chapter 4 (System Analysis & Design)**:
  - Requirements mapped to US-01 through US-07.
  - Multi-Criteria Decision-Making (MCDM) mathematical formulations validated in US-03, US-04, US-05.
- **Chapter 5 (Implementation, Testing & Evaluation)**:
  - Figure 5.8: Root directory structure and documentation (`README.md`).
  - Figure 5.9: GitHub Project Tracker Board and user stories (this document & GitHub Projects board).
  - Figure 5.10: Branching workflow (`main`, `updates`, `feat/*`).
  - Figure 5.11: Chronological Git commit logs.
  - Figure 5.12: Automated ISO 29119 test execution and GitHub Actions CI runs (`.github/workflows/test.yml`).
