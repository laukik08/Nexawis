# NEXAWIS — Product Requirements Document (PRD)

**Adaptive Workforce Intelligence Framework for Sustainable Project Team Formation**
Version 1.0 | Status: Draft for Development

---

## 1. Overview

NEXAWIS is a workforce-allocation platform that recommends project teams by evaluating employees across multiple dimensions — skills, experience, performance, workload, predicted burnout, collaboration, growth potential, and project fit — instead of matching on skills/availability alone.

The system combines two machine learning models (Burnout Prediction, Project Success Prediction), a rules-based scoring engine (AWIS — Adaptive Workforce Intelligence Score), a team recommendation engine, and an explainability layer, wrapped in a role-based, responsive web application.

**Model status:** both models are already trained and available as serialized `.pkl` artifacts (Burnout Prediction Model, Project Success Prediction Model). This PRD treats them as **integration targets, not training tasks** — the development work is building the model-serving layer, the input feature pipeline that feeds them, and the AWIS/recommendation logic that consumes their output. See §6 and §9 for what "integration" concretely requires (version pinning, input validation, serving architecture).

**Core deliverable for v1:** a secure, scalable, production-grade web application — usable on desktop, tablet, and mobile — where a Project Manager creates a project, the system evaluates and ranks eligible employees using the existing trained models, recommends one or more candidate teams with a predicted success score and human-readable explanation, and the manager approves/modifies/rejects the recommendation.

---

## 2. Goals / Non-Goals

### Goals (v1)
- Digital employee and project profiles (CRUD)
- Integration of the existing trained Burnout Prediction Model (`.pkl`) into the scoring pipeline
- Integration of the existing trained Project Success Prediction Model (`.pkl`) for recommended teams
- AWIS composite scoring engine (9 weighted dimensions)
- Rule-based eligibility filtering and business-rule validation (25 rules)
- Team recommendation engine (multiple candidate teams, ranked)
- Explainability output per recommendation (selection/rejection reasons, confidence)
- Role-based access: Admin, HR, Project Manager, Employee, Leadership
- Feedback capture at project close-out that feeds back into stored employee/project data
- Basic dashboards per role
- Responsive UI (desktop, tablet, mobile) built to production security and performance standards

### Non-Goals (v1 — explicitly out of scope)
- Payroll, attendance, or leave-management systems (integration only, not built here)
- Real-time chat/collaboration tools
- Full automated (no-human-approval) team assignment — human approval is mandatory
- Multi-tenant SaaS billing/subscription management
- Native mobile apps (responsive web only — see §11)
- Training the ML models from scratch — they already exist as trained `.pkl` files (see §6); v1 work is integration, not model development
- Automated model retraining pipeline in production (v1 ships with the existing trained, versioned models; retraining is a manual/offline process — see §9)

---

## 3. Roles & Permissions

| Role | Can Do | Cannot Do |
|---|---|---|
| **System Administrator** | Manage user accounts, departments, org settings, roles/permissions, monitor system health, manage integrations | Select teams, override AI recommendations, modify AWIS scores, approve allocations |
| **HR** | Create/edit employee profiles, update skills/certifications, manage availability, view workforce analytics | Approve project team assignments, override AWIS scores |
| **Project Manager** | Create/edit projects, define requirements, trigger recommendations, view rankings & explanations, accept/reject/modify recommended teams, submit post-project feedback | Edit other managers' projects (unless granted), modify another employee's HR profile fields |
| **Employee** | View/update own profile (skills, certifications, training), view own assignments, submit feedback | View other employees' full profiles, view AWIS scores, approve assignments |
| **Leadership** | View aggregated/org-level analytics and dashboards (workforce utilization, burnout distribution, skill gaps, success trends) | Access individual recommendation workflows, approve/reject team assignments |

**Authorization rule:** every write action must be scoped to the acting user's role and, where applicable, department/ownership (e.g., a PM can only edit projects they own or are assigned to, unless Admin).

---

## 4. Data Model

### 4.1 Employee Profile

| Category | Fields |
|---|---|
| **Identity** | Employee ID, Name, Department, Designation, Employment Type, Joining Date, Reporting Manager, Work Location, Employment Status |
| **Professional** | Technical Skills (list), Programming Languages, Framework Expertise, Domain Expertise, Certifications, Education, Years of Experience, Previous Projects, Specializations, Preferred Technologies |
| **Performance** | Performance Rating, Task Completion Rate, Quality Score, Deadline Adherence, Leadership Evaluation, Collaboration Score, Innovation Contribution, Project Success Participation, Recognition History |
| **Workload** | Active Projects, Weekly Working Hours, Resource Allocation %, Overtime Hours, Consecutive Working Days, Upcoming Deliverables, Available Capacity |
| **Wellbeing** | Mental Fatigue Score, Predicted Burnout Score, Burnout Trend, Work-Life Balance Indicator, Stress Risk, Recovery Period, Burnout History |
| **Growth** | Newly Acquired Skills, Certifications Earned, Training Completion, Learning Progress, Career Aspirations, Promotion Readiness, Leadership Potential |
| **Collaboration** | Team Compatibility, Cross-Functional Collaboration, Communication Effectiveness, Mentorship Contribution, Peer Feedback, Conflict Resolution, Knowledge Sharing |

**Lifecycle:** Profile is created at registration (Identity + baseline Professional fields) and evolves continuously — Performance/Workload/Wellbeing/Growth/Collaboration fields update after every project cycle and feedback event.

### 4.2 Project Profile

| Category | Fields |
|---|---|
| **Identity** | Project ID, Project Name, Department, Business Unit, Client, Project Manager, Start Date, Planned End Date, Current Status |
| **Business** | Business Priority, Strategic Importance, Expected Business Value, Revenue Impact, Innovation Level, Organizational Visibility, Client Criticality |
| **Technical Requirements** | Required Skills (mandatory / preferred split), Technology Stack, Programming Languages, Framework Knowledge, Domain Expertise, Security Requirements, Architecture Complexity |
| **Resource Requirements** | Required Team Size, Experience Level, Leadership Requirement, Specialist Roles, Mentor Requirement, Cross-functional Participation, Collaboration Requirement |
| **Complexity** | Technical Complexity, Requirement Stability, Integration Complexity, Innovation Requirement, Schedule Pressure, Risk Exposure, Scope Volatility |
| **Risk** | Technical Risk, Delivery Risk, Resource Risk, Dependency Risk, Requirement Change Risk, Client Escalation Risk |
| **Success Indicators** (post-hoc, for feedback) | Delivery Timeliness, Quality Targets, Customer Satisfaction, Budget Compliance, Team Stability, Business Outcome Achievement |

### 4.3 Entity Relationships (minimum viable)

```
Department 1───* Employee
Employee *───* Skill
Employee 1───* Certification
Employee 1───* WorkloadRecord (time-series)
Employee 1───* BurnoutScoreHistory (time-series)
Project *───1 Department
Project *───1 ProjectManager (Employee/User)
Project 1───* RequiredSkill (mandatory/preferred flag)
Project 1───* RecommendationRun
RecommendationRun 1───* CandidateTeam
CandidateTeam *───* Employee (team membership)
CandidateTeam 1───1 PredictedSuccessScore
CandidateTeam 1───1 Explanation
Project 1───* Feedback (post-completion)
```

---

## 5. Functional Requirements — Core Workflow

The system executes the following pipeline per recommendation request. Each stage is a functional requirement with a defined input/output.

| # | Stage | Input | Processing | Output |
|---|---|---|---|---|
| 1 | Employee Registration | HR/Admin form input | Validate required fields, create profile | Digital Employee Profile |
| 2 | Project Creation | PM form input | Validate required fields, create profile | Digital Project Profile |
| 3 | Requirement Analysis | Project Profile | Parse into mandatory/preferred skills, min experience, team composition, leadership need, constraints | Structured Requirements object |
| 4 | Eligibility Filtering | Employee pool + Requirements | Apply Rules 1–5 (§7.1) to exclude ineligible employees | Eligible Employee Pool |
| 5 | Burnout Prediction | Eligible pool's workload/wellbeing features | Run Burnout Prediction Model (§6.1) | Predicted Burnout Score per employee |
| 6 | AWIS Scoring | Eligible pool + burnout scores + project context | Compute 9-dimension composite score (§6.3) | Ranked employee list with AWIS scores |
| 7 | Business Rule Validation | Ranked list | Apply Rules 6–25 (§7) | Filtered/adjusted ranked list |
| 8 | Team Recommendation | Validated ranked list + team constraints | Multi-objective team construction (§6.4) — generate ≥1 candidate team, up to 3 alternatives | Candidate Team(s) |
| 9 | Project Success Prediction | Candidate Team(s), aggregated to team-level features | Run Project Success Prediction Model (§6.2) | Predicted Success Score per candidate team |
| 10 | Explainability | Candidate Team(s), scores, feature contributions | Generate per-employee and per-team explanation (§8) | Explanation object attached to each recommendation |
| 11 | Manager Review | Recommendation package | PM accepts / modifies / rejects / requests alternatives | Approved Project Team |
| 12 | Project Execution Monitoring | Ongoing workload/performance data | Continue updating workload & burnout time-series | Updated organizational data |
| 13 | Feedback Collection | Project close-out | Structured feedback form (manager, employee, HR) | Feedback record |
| 14 | Continuous Learning (offline) | Accumulated Feedback + outcomes | Feed into next model retraining cycle (manual, not real-time in v1) | Updated training dataset |

**Acceptance criterion for the pipeline:** a PM must be able to go from "create project" to "receive at least one explainable, ranked team recommendation with a predicted success score" in a single guided flow, with no stage silently skipped or unexplained.

---

## 6. AI / Scoring Engine Specification

> **Status:** Both models below are **already trained and delivered as serialized `.pkl` files**. Development scope here is: build the model-serving layer, the feature pipeline that prepares live application data into the exact shape/order/encoding the `.pkl` expects, and the consumers (AWIS, Recommendation Engine) that use the output — **not** training or algorithm selection.

### 6.1 Burnout Prediction Model (pre-trained, `.pkl`)

- **Type:** Regression (not classification) — outputs a continuous burnout value.
- **Target variable:** `Burn_Rate` (continuous), normalized into the internal Burnout Score (0–1 or 0–100 scale — pick one and use consistently across the system).
- **Input features (10) — must be reproduced exactly in the serving pipeline, same names/order/encoding used at training time:**
  - Organizational: `Company_Type`, `WFH_Setup_Available`, `Designation`
  - Professional: `Experience_Years`, `Resource_Allocation`
  - Wellbeing: `Mental_Fatigue_Score`
  - Workload: `Weekly_Work_Hours`, `Overtime_Hours`, `Utilization_Percentage`, `Consecutive_Working_Days`
- **Algorithm (as trained):** confirm from the model artifact/metadata whether Random Forest or XGBoost was the selected final model — do not re-derive; document actual algorithm, library, and version used once confirmed.
- **Known evaluation metrics (from training):** R², MAE, RMSE, generalization gap — pull the actual recorded values from the training report and log them as the model's baseline in the model registry (§9.1), so future retrains have something to beat.
- **Output consumed by:** AWIS Burnout Intelligence dimension (§6.3) and Rule 6 (Burnout Protection).

### 6.2 Project Success Prediction Model (pre-trained, `.pkl`)

- **Type:** Regression — outputs a continuous `Success_Score`, not a binary success/failure label.
- **Input features — must be reproduced exactly in the serving pipeline:**
  - Team-level (aggregated from member employee profiles): Average Skill Level, Average Experience, Average Performance, Average Burnout, Average Training, Average Certifications, Average Collaboration, Mentor Ratio, Team Size.
  - Project-level: Project Priority, Project Complexity, Requirement Stability, Technical Risk, Schedule Pressure, Client Engagement, Innovation Index, Scope Change, Employee Turnover, Budget Variance, Delivery Delay Days.
- **Aggregation requirement:** employee-level attributes must be aggregated to team-level (mean, or mean + ratio where noted, e.g., Mentor Ratio) before being passed to this model. This aggregation step is a required, separate function — not inline in the recommendation engine — and must match exactly how the training pipeline aggregated features.
- **Algorithm (as trained):** confirm from the model artifact/metadata; document actual algorithm, library, and version.
- **Output consumed by:** Recommendation Engine (to compare/rank candidate teams) and manager-facing team comparison view.

### 6.2a Model Integration Requirements (both models)

- **Model-serving architecture:** load both `.pkl` files behind an internal inference service/module (e.g., a dedicated FastAPI/Flask microservice or an in-process serving layer) — never `pickle.load()` a model file directly inside a request handler on every call; load once at startup, keep in memory, reload on version bump.
- **Untrusted deserialization risk:** `.pkl` files execute arbitrary code on load (Python `pickle` is not a safe deserialization format). Both files must come only from a controlled, versioned internal artifact store (never a user upload path), checksummed (e.g., SHA-256) at deploy time to detect tampering, and loaded only from a fixed, access-controlled path — never dynamically referenced by user-supplied input.
- **Library/version pinning:** the scikit-learn / XGBoost (or whichever library produced the `.pkl`) version used to load the model **must match** the training-time version range; unpinned upgrades can silently break or corrupt predictions. Pin exact versions in the dependency lockfile and add a startup self-test (run one known input, assert output in expected range) before the service accepts traffic.
- **Input validation before inference:** every feature must be schema-validated (type, range, required/optional) before being passed to the model — reject and log malformed input rather than letting it silently produce a garbage prediction.
- **Output sanity bounds:** clamp/flag predictions outside plausible bounds (e.g., burnout score outside 0–1, success score outside its trained range) rather than passing them straight to the UI.
- **Fallback behavior:** define what the system does if the model service is unavailable (e.g., queue the recommendation request, show a clear "scoring temporarily unavailable" state) — the recommendation flow must degrade gracefully, not silently return partial/fake scores.

### 6.3 AWIS — Adaptive Workforce Intelligence Score

AWIS is the composite per-employee, per-project suitability score. It combines **9 intelligence dimensions**:

| Dimension | Key inputs |
|---|---|
| 1. Skill Intelligence | Required skill match, domain knowledge, certifications, skill diversity/relevance |
| 2. Experience Intelligence | Years of experience, domain-specific experience, similar-project history, leadership experience |
| 3. Performance Intelligence | Historical ratings, task completion quality, delivery consistency, managerial evaluations |
| 4. Availability Intelligence | Current assignments, remaining capacity, planned leave, resource allocation |
| 5. Workload Intelligence | Weekly hours, overtime, consecutive working days, active project count, utilization |
| 6. Burnout Intelligence | Predicted Burnout Score (from §6.1), mental fatigue, historical workload exposure |
| 7. Collaboration Intelligence | Team participation, communication effectiveness, cross-functional collaboration |
| 8. Learning & Growth Intelligence | Training participation, certifications, skill improvement trend |
| 9. Project Compatibility Intelligence | Alignment with project priority/complexity/domain/team composition |

**Computation pipeline (required, in order):**
1. **Eligibility verification** — apply Rules 1–5; ineligible employees excluded before scoring (no wasted computation).
2. **Score normalization** — each of the 9 dimensions is normalized to a common scale (e.g., 0–1) before combination, since raw units differ (years, ratings, percentages, predicted continuous burnout).
3. **Context-aware weighting** — dimension weights are not fixed; they shift by project type:
   - High-criticality projects → upweight Skill, Experience, Performance
   - Innovation-oriented projects → upweight Learning/Growth, Skill diversity, Collaboration
   - Long-duration projects → upweight Burnout, sustainable Workload, Availability
   - Leadership-intensive projects → upweight Experience (leadership), Collaboration, Communication
   - **Dev note:** implement as a configurable weight matrix keyed by project-type tag, not hardcoded per-project logic — Admin should be able to adjust weight profiles.
4. **Composite score generation** — weighted sum (or weighted geometric mean — pick one, document the choice) of normalized dimension scores → single AWIS value per employee per project.
5. **Business rule validation** — apply Rules 6–25 against the ranked list (may downrank, flag, or exclude).
6. **Candidate ranking** — sort eligible, validated employees by AWIS descending.
7. **Tie resolution** — define a deterministic tiebreaker order (e.g., Burnout Intelligence ascending → Availability descending → Experience descending) so ranking is reproducible.

### 6.4 Recommendation Engine (Team Construction)

- Input: ranked/validated employee list + project resource requirements (team size, required skill coverage, leadership requirement, mentor requirement).
- Must optimize jointly for: mandatory skill coverage (Rule 10), team seniority balance (Rule 11), leadership presence (Rule 12), workload/burnout sustainability (Rules 6–9), and fair opportunity distribution (Rule 20) — this is a **multi-objective constraint-satisfaction problem, not a simple top-N select**.
- Must produce **at least one** valid team; should attempt up to **3 alternative candidate teams** when the eligible pool allows, so managers can compare.
- Each candidate team is passed through the Project Success Prediction Model (§6.2) to attach a comparative success score.

---

## 7. Business Rules (Functional Acceptance Criteria)

These are hard requirements the system must enforce. Group and priority order below is authoritative for conflict resolution.

**Priority order (highest first):** 1) Employee Wellbeing & Safety → 2) Mandatory Project Requirements → 3) Organizational Policies → 4) Project Success Probability → 5) Workforce Sustainability → 6) Employee Growth Opportunities → 7) Recommendation Optimization.

### 7.1 Employee Eligibility (hard filters — applied at Stage 4)
1. **Active Employment** — only Active-status employees are eligible.
2. **Skill Eligibility** — must hold all mandatory project skills; preferred skills are scoring-only, not a filter.
3. **Availability** — must have sufficient available capacity; over-allocated employees excluded unless explicitly manager-approved.
4. **Department Compatibility** — must satisfy project's department constraints.
5. **Experience Requirement** — senior-experience roles prioritize experienced employees; junior employees remain eligible when project explicitly supports mentorship/learning.

### 7.2 Wellbeing (scoring/warning rules)
6. **Burnout Protection** — high predicted-burnout employees get reduced ranking priority; if assigned anyway, system must surface an explicit warning to the manager.
7. **Workload Balance** — avoid repeatedly recommending the same employees when equally suitable alternatives exist.
8. **Overtime Awareness** — consistently high-overtime employees should not be stacked onto additional high-pressure projects.
9. **Recovery Consideration** — employees recently off intensive projects should get reduced priority for similar workloads where feasible.

### 7.3 Project/Team Composition
10. **Mandatory Skill Coverage** — every required project skill must be represented by at least one team member; system must block/flag team finalization if uncovered.
11. **Team Balance** — recommended teams should mix seniority levels where team size allows.
12. **Leadership Availability** — projects requiring leadership must include ≥1 employee with leadership capability/experience.
13. **Project Priority** — higher-priority projects can justify assigning highly experienced employees, provided Rule 6–9 aren't materially violated.
14. **Project Complexity** — higher complexity → favor stronger experience/collaboration/performance in ranking weights.

### 7.4 Recommendation Governance
15. **Multi-Factor Evaluation** — no recommendation may be generated from a single factor; must reflect the full AWIS dimension set.
16. **Explainability** — every recommendation must include selection reasons, rejection reasons for notable alternatives, contributing factors, risks, and a confidence indicator. **A recommendation with no explanation must not be shown to a manager — block it at the API level.**
17. **Alternative Recommendations** — system should offer multiple team options where the eligible pool supports it.
18. **Human Approval** — recommendations are advisory only; no automatic assignment. Final state change (team → "Approved") requires an explicit PM action.

### 7.5 Growth & Fairness
19. **Learning Opportunities** — where project risk allows, factor in learning potential for stretch assignments.
20. **Fair Opportunity Distribution** — system must track recommendation frequency per employee and avoid systematically over-recommending a small subset when alternatives are equally qualified.
21. **Knowledge Distribution** — favor team compositions that pair experienced and developing employees.

### 7.6 Organizational Integrity
22. **Organizational Sustainability** — optimize for long-term org value, not only fastest project completion.
23. **Continuous Learning** — every completed project's feedback must be persisted and made available to the (offline) retraining dataset.
24. **Data Integrity** — validation constraints on employee/project data entry (required fields, valid ranges, no stale records beyond a defined staleness threshold — e.g., flag profiles not updated in 90+ days).
25. **Ethical Allocation** — recommendation logic must not use non-performance-related personal characteristics as model features or scoring inputs (explicit exclusion list required in feature engineering: no protected-class attributes).

---

## 8. Explainability Requirements

For every recommendation output, the system must generate and persist:

- **Employee-level explanation:** why selected (top contributing AWIS dimensions with relative weight/impact), or why not selected (which eligibility rule or low-scoring dimension excluded them).
- **Team-level explanation:** why this team composition, how it satisfies mandatory skill coverage and team-balance rules.
- **Feature contribution breakdown:** per-dimension contribution to the final AWIS score (numeric or relative-bar representation) — needed for the manager-facing UI.
- **Confidence indicator:** a derived confidence value/band for both the AWIS ranking and the Project Success prediction (e.g., based on data completeness and model uncertainty — define the exact method during design).
- **Risk flags:** explicit warnings (e.g., "selected employee has elevated burnout risk", "mandatory skill X covered by only one team member").

This output structure must be stored (not computed ad hoc on view) so recommendations remain auditable after the fact.

---

## 9. Continuous Learning / Feedback Loop (v1 scope)

- Post-project feedback form captured from: Project Manager, Employee(s), HR (optional).
- Feedback categories: Technical, Collaboration, Wellbeing, Leadership, Process, Strategic.
- Feedback + actual project outcome data (delivery timeliness, quality, budget compliance, team stability) is persisted against the Project and its team members.
- **v1 requirement:** this data is exportable/queryable as a clean training dataset for offline model retraining. **Automatic/online retraining is out of scope for v1** — retraining is a manual, versioned, offline process with a documented before/after evaluation (R², MAE, RMSE comparison) before a new model is promoted to production.

### 9.1 Model Registry (v1 requirement, not future work)

Even though both current models ship as static `.pkl` files, v1 still needs a lightweight model registry:

- Version ID, checksum, upload date, and the training-time evaluation metrics for each deployed `.pkl`.
- Every prediction (burnout score, success score) logged against the exact model version that produced it — required for §8 auditability and for meaningfully comparing "old model vs. new model" whenever a manual retrain happens later.
- A defined promotion process: a new `.pkl` is never hot-swapped into production without passing the same evaluation checks and an explicit Admin action.

---

## 10. Security Requirements

Employee wellbeing, burnout, and performance data is sensitive HR data. Security is a first-class requirement, not a hardening pass done after launch.

### 10.1 Authentication & Session Management
- Password storage: salted, adaptive hashing (bcrypt/Argon2) — never reversible encryption, never plaintext.
- Enforce strong password policy + account lockout/backoff after repeated failed attempts (mitigate brute force).
- Support MFA for Admin and HR roles at minimum (highest-sensitivity data access).
- Session tokens (JWT or server-side session) must be short-lived with refresh-token rotation; invalidate all sessions on password change.
- Secure cookie flags where cookies are used: `HttpOnly`, `Secure`, `SameSite=Strict/Lax`.

### 10.2 Authorization
- Enforce role-based access control (§3) **server-side on every endpoint** — never rely on the frontend hiding a button as the actual control.
- Object-level authorization: a Project Manager fetching `/projects/{id}` must be checked for ownership/assignment, not just "is a PM" (prevents Insecure Direct Object Reference / IDOR — e.g., PM A viewing PM B's project by guessing an ID).
- Field-level authorization for sensitive data: burnout score, wellbeing indicators, performance ratings must be filtered out of API responses for roles not entitled to see them (§10.4 also covers this), not just hidden in the UI.

### 10.3 Input Validation & Injection Prevention
- Parameterized queries / ORM only — no raw string-concatenated SQL, anywhere (SQL injection).
- Server-side validation of all input (type, length, format, allowed range) — client-side validation is UX only, never the security boundary.
- Sanitize/escape all user-supplied content rendered in the UI (stored and reflected XSS prevention); use a templating/frontend framework that auto-escapes by default (e.g., React) rather than manual string concatenation into HTML.
- File upload handling (e.g., resumes/certificates if supported later): validate file type by content not extension, enforce size limits, store outside the web root or in object storage with no execute permission, scan for malware if feasible.
- CSRF protection on all state-changing requests (anti-CSRF token or same-site cookie + custom header check).

### 10.4 Data Protection
- Encryption in transit: TLS everywhere (HTTPS only, HSTS enabled) — no plaintext HTTP, including internal service-to-service calls where feasible.
- Encryption at rest for the database, and specifically for the most sensitive fields (burnout/wellbeing data, performance ratings) — consider column-level encryption in addition to disk-level encryption.
- Secrets management: DB credentials, API keys, model-signing checksums, JWT signing keys must live in a secrets manager / environment-injected config — never hardcoded or committed to source control.
- Principle of least privilege for the database user the app connects as (no reason the app's DB user needs schema-drop permissions in production).
- Data retention & deletion: define how long burnout/wellbeing history is retained and how an employee's data is purged on offboarding, consistent with applicable data-protection law.

### 10.5 API & Infrastructure Hardening
- Rate limiting on all public endpoints, especially auth (`/login`) and the recommendation-generation endpoint (which is computationally expensive — also a DoS surface).
- CORS configured to an explicit allow-list of known frontend origins — never `*` in production.
- Security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or CSP frame-ancestors), `Referrer-Policy`.
- Dependency scanning (SCA) in CI for both the frontend and backend package trees, including the ML-serving service's Python dependencies — flag known-CVE packages before deploy.
- Structured audit logging (§8, §9.1) written to an append-only/log-protected store — logs themselves should not be editable by application users, including Admins, without a separate audit trail of the edit.
- Error handling: never return stack traces, ORM errors, or internal paths to the client — log detail server-side, return a generic error to the client.

### 10.6 ML-Specific Security (ties to §6.2a)
- `.pkl` deserialization risk is the single biggest ML-specific attack surface in this system (arbitrary code execution on load) — enforce the controlled-artifact-store + checksum policy from §6.2a without exception, including in staging/dev environments.
- Treat the feature pipeline feeding the models as untrusted-input surface too: a malformed or adversarial employee/project record should not be able to crash or corrupt the inference service (§6.2a input validation).
- Do not expose raw model internals (e.g., full feature-importance dumps beyond what's needed for §8 explainability) through the API in a way that would let an external actor reverse-engineer scoring to game their own AWIS rank.

---

## 11. Responsive Design & Performance

This is a real, end-to-end product used by managers and employees on whatever device they have open at the moment — not a desktop-only internal tool.

### 11.1 Responsive / Cross-Device
- Fully responsive layout across three breakpoints minimum: mobile (~360–480px), tablet (~768–1024px), desktop (1280px+) — not just a shrunk desktop layout; navigation, tables, and forms need device-appropriate patterns (e.g., ranked-candidate tables collapse to cards on mobile, not horizontal-scroll grids).
- Touch-target sizing and spacing appropriate for tablet/mobile use (Admin/HR/PM users will realistically review recommendations on a tablet in a meeting).
- Progressive disclosure on small screens: full AWIS dimension breakdowns and explanation detail (§8) should be available on mobile but summarized by default, with drill-down — not force a 9-dimension table into a 360px viewport.
- Test matrix should explicitly include: latest 2 versions of Chrome/Safari/Edge, iOS Safari, and Android Chrome, at each breakpoint above.
- Since native mobile apps are out of scope (§13), the responsive web app is the mobile experience — it needs to genuinely work well on a phone, not just "not break."

### 11.2 Performance
- **Recommendation generation** (the heaviest pipeline — §5 stages 4–10) is the primary performance risk. Target: return at least an initial ranked result within a few seconds for a typical department-sized employee pool; if the full pipeline (including multiple candidate teams + success prediction + explanation generation) takes longer, show progressive/loading state rather than a blocking spinner with no feedback.
- Model inference (§6.2a) should run as batched calls (score the whole eligible pool in one call where the model/library supports it) rather than one inference call per employee in a loop.
- Database: index employee search/filter fields used in eligibility filtering (§7.1) — department, skills, employment status, availability — since that query runs on every recommendation request.
- Cache read-heavy, slow-changing data (e.g., skill taxonomies, department lists, weight-matrix config from §6.3) rather than re-fetching on every request; do not cache anything person-specific/sensitive client-side beyond session lifetime.
- Frontend performance: code-split by route, lazy-load dashboard charts/heavy visualization libraries, compress and responsively size any images/avatars — mobile users are the most bandwidth/CPU constrained and most likely to churn on a slow load.
- Define and monitor actual performance budgets once real usage data exists (e.g., p95 API latency, Time to Interactive on mobile) — don't leave "fast" undefined; put numeric SLOs in the design/architecture doc that follows this PRD.

### 11.3 Frontend Tech Stack & Modern UI/UX

The explicit product goal is a site that reads as a real, current-generation SaaS product — not a generic admin-panel template or an obviously AI-generated layout. This is a design/engineering requirement, not decoration, because manager trust in the recommendations (§8) is partly earned by the product feeling credible and deliberate.

- **Framework:** React (or Next.js if SSR/SEO/routing-at-scale is wanted) as the base. Component-driven architecture throughout — no large monolithic page components.
- **Component library foundation:** build on a headless/unstyled primitive layer (e.g., Radix UI or shadcn/ui) rather than a heavy pre-styled kit (Bootstrap-style libraries) — this is what avoids the generic "AI-template" look, since the visual design is owned by the team, not inherited wholesale from a kit's default theme.
- **Styling:** utility-first CSS (Tailwind CSS) with a proper design-token layer (spacing scale, type scale, color system, radii, shadows) defined once and reused — not ad hoc inline styles or per-component magic numbers.
- **Motion/animation:** Framer Motion for interaction and state-transition animation — page/route transitions, list reordering when AWIS rankings update, expand/collapse of explanation detail (§8), skeleton-to-content reveals, modal/drawer entrances. Motion should be purposeful (communicate state change, guide attention) and respect `prefers-reduced-motion`, not decorative motion for its own sake.
- **3D/visual flourish (optional, where it earns its place):** React Three Fiber (Three.js) is reasonable for a landing/marketing surface or a distinctive dashboard hero moment, but is **not** appropriate inside data-heavy workflows (recommendation review, employee tables) where it would hurt clarity, accessibility, and performance on lower-end devices/tablets. Scope 3D use explicitly — don't default to it everywhere.
- **Data visualization:** a charting library appropriate for the dashboards (§2 goals) — e.g., Recharts or D3-based — with a consistent visual language matching the design tokens above, not the library's default theme out of the box.
- **State/data layer:** a proper client data-fetching/caching layer (e.g., TanStack Query) for server state, separate from local UI state — this also directly supports the perceived-performance goals in §11.2 (optimistic updates, cached navigation).
- **Design intent, concretely:** distinctive typography (not default system-font stacks), an intentional color system (not default Tailwind/Bootstrap blue), real empty/loading/error states designed with the same care as the "happy path," and micro-interactions on key actions (accept/reject a recommendation, submit feedback) — these are the details that separate a considered product from a template. Establish this direction as an actual design system/style guide before broad component build-out, not discovered ad hoc per screen.
- **Accessibility is part of "modern," not separate from it:** semantic HTML, keyboard navigability, ARIA labeling on custom components (especially anything built on headless primitives), sufficient color contrast — non-negotiable given this product handles sensitive wellbeing data reviewed by managers who may use assistive tech.

---

## 12. Non-Functional Requirements (General)

| Category | Requirement |
|---|---|
| **Auditability** | Every AWIS computation, recommendation, and manager decision (accept/modify/reject) must be logged with timestamp, actor, and model version. |
| **Explainability latency** | Explanation generation must not be a separate slow batch job — it must accompany the recommendation response. |
| **Data privacy** | Personal wellbeing/burnout data visible only to HR, the employee themselves, and their direct Project Manager for active assignments — not to peers. |
| **Fairness** | No protected-class attribute (as defined by applicable employment law) may be used as a model feature or scoring input. |
| **Human override** | Every AI-driven state transition (recommendation → approved team) requires an explicit human action; no fully autonomous assignment path exists. |
| **Scalability (target, not v1-mandatory)** | Architecture should not hardcode assumptions that block later multi-department/multi-project-portfolio scaling. |
| **Model reproducibility** | Given the same employee/project data snapshot and model version, AWIS/predictions must be reproducible (deterministic tie-breaking, fixed random seeds for training). |
| **Availability** | Define an uptime target (e.g., business-hours availability at minimum) and graceful-degradation behavior for the model-serving layer (§6.2a fallback). |

---

## 13. Out of Scope (v1)

- Automated real-time model retraining
- Payroll/attendance/leave system (only data fields relevant to workload, not process)
- Fully autonomous team assignment without manager approval
- Predictive hiring/recruitment recommendations
- Native mobile applications (responsive web covers mobile — see §11.1)
- Multi-tenant/enterprise SSO (single-org deployment assumed for v1)

---

## 14. Open Items for Design Phase

- Exact AWIS normalization method (min-max vs. z-score) and combination formula (weighted sum vs. weighted geometric mean).
- Exact confidence-score calculation method for recommendations.
- Storage format for time-series workload/burnout history (needed for burnout trend and 90-day staleness checks).
- Definition of "sufficient available capacity" threshold (Rule 3) — needs a concrete numeric policy, currently qualitative in source material.
- Context-aware weight matrix values per project-type tag (§6.3 step 3) — needs actual numeric weights, not just directional guidance.
- Confirm actual algorithm/library/version baked into each `.pkl` (§6.1, §6.2) and retrieve their original training-time evaluation metrics — needed to seed the model registry (§9.1) with real baselines instead of placeholders.
- Decide model-serving deployment shape: in-process (loaded inside the main backend) vs. a separate microservice — affects §6.2a fallback design and §11.2 performance/caching approach.
- Numeric performance SLOs (§11.2) and uptime target (§12 Availability) — currently flagged as needing definition, not yet set.
- Final design-system decisions (§11.3): exact color palette, type pairing, and where (if anywhere) 3D/React Three Fiber is actually used vs. skipped — should be settled with real mockups before component build-out starts, not decided inline while coding.
