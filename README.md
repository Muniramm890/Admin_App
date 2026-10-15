# School Office — Teacher App

Admin panel (`schoolOfficeAdminFront`) ka single `App.tsx` module-wise alag files me tod kar banaya gaya hai.
Code admin se exact copy hai; har file ke top par `// FILE:` (is repo me path) aur `// Source:` (admin `App.tsx` ki line range) likha hai.
Backend aur routes same hain (`SCHOOL-ERP-backend`).

```text
src/
├── main.tsx, App.tsx          app boot + MainLayout (login / splash / shell)
├── layout/SchoolERP.tsx       main shell: topbar + sidebar + module switch
├── components/
│   ├── layout/                Sidebar, navItems.ts  (teacher ke liye modules yahin se hide honge)
│   ├── modals/                NotificationModal, ProfileModal
│   └── ui/                    Icon, Modal, KpiCard, FormRow/Grid/Field, Avatar, PdfViewerModal ...
├── modules/                   har module ka apna folder (Module + Tabs + helpers.ts)
│   dashboard, setup, students, teachers, promotion, transport, commhub,
│   attendance, arrangement, timetable, tests, homework, fees, payroll,
│   exams, results, leaderboard, analytics, usermanagement, auditlogs
├── shared/subjects/           setup + teachers + exams + timetable ke beech shared
├── contexts/                  Auth, Dialog, Session, Data
├── api/                       client (apiRequest), uploads, gas
├── hooks/, utils/, data/, theme/, pages/ (Login, ForgotPassword)
```

Routing: `react-router-dom` — har module ka apna URL (`/students`, `/fees`, `/transport` ...). Production hosting par SPA fallback (sab paths → `index.html`) lagana zaroori hai.

Run: `npm install` → `npm run dev`  |  Build: `npm run build`
