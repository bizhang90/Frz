# FriendZones Unified v2.5.1

## Supabase SQL hotfix

- Fixed PostgreSQL syntax error in `fnb_v_attendance_monthly` by explicitly quoting the output column alias as `"month"`.
- Updated the post-deploy verification query to reference `"month"` consistently.
- No changes to website UI, Venus, Volga, restaurant pages, HR business rules, GPS attendance logic, or RLS design.
- Migration `005_hr_attendance_production.sql` remains idempotent and can be rerun after the failed v2.5.0 attempt.
