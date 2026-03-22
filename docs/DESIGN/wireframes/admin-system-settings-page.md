# Admin System Settings Page

> **Purpose:** Global system configuration and settings (email, authentication, integrations)
> **Users:** Admin role only (superadmin settings)
> **Current Implementation:** `app/pages/admin/settings.vue` (to be created)
> **Last Updated:** 2026-02-14
> **Version:** 1.0

---

## 🎯 Key Principle

**System Settings = Global Configuration**
- Email notification settings
- Authentication configuration
- Integration settings (Looker Studio, Google OAuth)
- System maintenance and diagnostics
- Audit log settings

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AdminLayout` with settings sidebar navigation
- Header: Breadcrumb + page title
- Content: Tabbed settings sections

**Key Sections:**
- Email & Notifications
- Authentication
- Integrations
- System Maintenance
- Audit & Logging

---

## 🎨 Page Layout

```
┌──────────────────────────────────────────────────────┐
│  ⚙️ System Settings                                  │
├────────────────────────┬────────────────────────────┤
│  SETTINGS MENU         │  EMAIL & NOTIFICATIONS     │
│                        │                            │
│ • Email & Notifs      │  SMTP Configuration        │
│ • Authentication      │  Server: [smtp.gmail.com] │
│ • Integrations        │  Port: [587]               │
│ • Maintenance         │  From Email: [admin@...]   │
│ • Audit & Logging     │                            │
│ • Appearance          │  ☑ Enable Email Notifs    │
│                        │                            │
│                        │  Template Defaults:        │
│                        │  • Welcome email           │
│                        │  • Invitation email        │
│                        │  • Permission notification │
│                        │                            │
│                        │  [Test Email] [Save]      │
│                        │                            │
└────────────────────────┴────────────────────────────┘
```

---

## 📧 Email & Notifications

```
┌─────────────────────────────────────────────┐
│  EMAIL & NOTIFICATIONS                      │
├─────────────────────────────────────────────┤
│                                             │
│  SMTP Configuration:                        │
│  ────────────────────                      │
│  Server: [smtp.gmail.com]                  │
│  Port: [587]                               │
│  Username: [admin@streamhub.com]           │
│  Password: [••••••••]  [Change]            │
│  Use TLS: ☑ Enabled                        │
│                                             │
│  From Address:                              │
│  [admin@streamhub.com]                     │
│  Display Name: [StreamHub Admin]           │
│                                             │
│  NOTIFICATION SETTINGS:                     │
│  ────────────────────────                  │
│  ☑ Send user invitations                   │
│  ☑ Send permission changes                 │
│  ☑ Send dashboard shared notifications     │
│  ☐ Send daily summary emails               │
│                                             │
│  Test Email Address:                        │
│  [john@example.com]                        │
│  [Send Test Email]                         │
│                                             │
│  [Save Changes] [Reset to Defaults]        │
│                                             │
└─────────────────────────────────────────────┘
```

**Configuration:**
- SMTP server details (host, port, credentials)
- Email "From" address and display name
- TLS/SSL encryption option
- Test email functionality

**Notification Types:**
- User invitations
- Permission/access changes
- Dashboard sharing notifications
- Daily/weekly summary emails

---

## 🔐 Authentication Settings

```
┌─────────────────────────────────────────────┐
│  AUTHENTICATION                             │
├─────────────────────────────────────────────┤
│                                             │
│  GOOGLE OAUTH:                              │
│  ────────────────                          │
│  Status: 🟢 Configured                     │
│                                             │
│  Client ID:                                 │
│  [xxxxxxxxxx.apps.googleusercontent.com]   │
│                                             │
│  Redirect URIs:                             │
│  • https://streamhub.example.com/callback  │
│  • http://localhost:3000/callback          │
│                                             │
│  [Test Connection]                         │
│                                             │
│  SECURITY:                                  │
│  ────────────                              │
│  ☑ Require email verification              │
│  ☑ Auto-logout after (30) minutes          │
│  ☐ Force password reset on first login     │
│  ☑ Enable 2FA for admin users              │
│                                             │
│  Session Timeout: [30] minutes             │
│                                             │
│  [Save Changes]                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Configuration:**
- Google OAuth credentials
- Redirect URIs
- Email verification requirement
- Session timeout settings
- 2FA for admin users
- Security policies

---

## 🔗 Integration Settings

```
┌─────────────────────────────────────────────┐
│  INTEGRATIONS                               │
├─────────────────────────────────────────────┤
│                                             │
│  LOOKER STUDIO:                             │
│  ──────────────                            │
│  Status: 🟢 Connected                      │
│  Last Sync: 2 hours ago                    │
│                                             │
│  API Key: [••••••••••] [Regenerate]       │
│                                             │
│  Auto-Sync Dashboards:                     │
│  ☑ Enabled (every 24 hours)               │
│  Last Run: 2026-02-13 02:00 UTC           │
│                                             │
│  [Test Connection] [View Logs]             │
│                                             │
│  FIRESTORE:                                 │
│  ─────────                                 │
│  Status: 🟢 Connected                      │
│  Database: streamhub-prod                  │
│                                             │
│  Backup Configuration:                      │
│  ☑ Automated backups enabled               │
│  Frequency: Daily at 2:00 UTC             │
│  Retention: 30 days                        │
│                                             │
│  [Backup Now] [View Backups]              │
│                                             │
│  [Save Changes]                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Looker Integration:**
- API credentials
- Auto-sync settings
- Sync history and logs

**Firestore Configuration:**
- Database selection
- Backup settings
- Retention policy

---

## 🛠️ System Maintenance

```
┌─────────────────────────────────────────────┐
│  MAINTENANCE                                │
├─────────────────────────────────────────────┤
│                                             │
│  DATABASE OPTIMIZATION:                     │
│  ──────────────────────                    │
│  Last Cleanup: 2026-02-13                  │
│  Next Scheduled: 2026-02-20                │
│                                             │
│  [Run Optimization Now]                    │
│                                             │
│  CLEANUP TASKS:                             │
│  ──────────────                            │
│  ☑ Auto-delete expired invitations         │
│  ☑ Archive inactive users (6 months)       │
│  ☑ Cleanup old audit logs (90 days)       │
│                                             │
│  CACHE MANAGEMENT:                          │
│  ────────────────                          │
│  Cache Size: 45 MB / 100 MB                │
│  [Clear Cache]                             │
│  [Optimize Cache]                          │
│                                             │
│  DIAGNOSTIC TOOLS:                          │
│  ────────────────                          │
│  [Run Health Check]                        │
│  [View System Status]                      │
│  [View Error Logs]                         │
│                                             │
│  [Save Settings]                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Maintenance Features:**
- Database optimization
- Auto-cleanup policies
- Cache management
- Health diagnostics
- System status monitoring

---

## 📋 Audit & Logging

```
┌─────────────────────────────────────────────┐
│  AUDIT & LOGGING                            │
├─────────────────────────────────────────────┤
│                                             │
│  AUDIT LOG SETTINGS:                        │
│  ────────────────────                      │
│  ☑ Enable audit logging                    │
│  Retention Period: [90] days                │
│                                             │
│  Log Actions:                               │
│  ☑ User login/logout                       │
│  ☑ Permission changes                      │
│  ☑ Admin actions                           │
│  ☑ API calls (admin only)                  │
│  ☐ All user actions                        │
│                                             │
│  Email on Critical Events:                  │
│  ☑ Multiple login failures                 │
│  ☑ Permission privilege escalation         │
│  ☑ Mass data operations                    │
│  Send To: [admin@example.com]              │
│                                             │
│  RECENT AUDIT EVENTS:                       │
│  ───────────────────                       │
│  2 hours ago - John Admin granted           │
│                permissions to Sarah         │
│  4 hours ago - User "Bob" invited to        │
│                company STTH                 │
│  1 day ago  - Dashboard "Q4 Report"         │
│                created by Sarah             │
│                                             │
│  [View Full Audit Log]  [Export Audit Log] │
│                                             │
│  [Save Settings]                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Audit Configuration:**
- Enable/disable audit logging
- Log retention policy
- Which actions to log
- Email alerts for critical events

---

## 🎨 Appearance Settings

```
┌─────────────────────────────────────────────┐
│  APPEARANCE                                 │
├─────────────────────────────────────────────┤
│                                             │
│  THEME:                                     │
│  ─────                                      │
│  ◉ Light   ○ Dark   ○ Auto (System)        │
│                                             │
│  APPLICATION SETTINGS:                      │
│  ─────────────────────                     │
│  Page Title: [StreamHub Dashboard]         │
│  Logo URL: [/images/logo.png]              │
│  Favicon URL: [/images/favicon.ico]        │
│                                             │
│  Colors (Optional):                         │
│  Primary Color: [#3b82f6] [Color Picker]   │
│  Secondary Color: [#10b981] [Color Picker] │
│                                             │
│  [Preview] [Reset to Defaults]             │
│                                             │
│  [Save Changes]                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Appearance Options:**
- Theme (light/dark/auto)
- Branding (logo, title, colors)
- Font preferences (optional)

---

## 📱 Responsive Design

- **Desktop (>1024px):** Full sidebar navigation + content
- **Tablet (768-1024px):** Collapsible sidebar
- **Mobile (<768px):** Hamburger menu + stacked forms

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Admin Dashboard** | Admin overview | [admin-dashboard-home-page.md](./admin-dashboard-home-page.md) |
| **Admin Permissions** | Permission management | [admin-permission-management-page.md](./admin-permission-management-page.md) |
| **User Management** | User CRUD page | [admin-user-management-page.md](./admin-user-management-page.md) |
| **Company Management** | Company CRUD page | [admin-company-management-page.md](./admin-company-management-page.md) |
| **Explorer** | Folder + Dashboard management | [admin-explorer-page.md](./admin-explorer-page.md) |
| **Design System** | Colors, typography | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

**Created:** 2026-02-14
**Version:** 1.0 (Initial v4.0 consolidated format)
**Designer:** Development Team
