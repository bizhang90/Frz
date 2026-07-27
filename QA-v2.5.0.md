# QA v2.5.0

## Static checks

- [x] Node syntax: router, Supabase helper, employee app, auth guard, login.
- [x] `vercel.json` valid JSON.
- [x] Production config defaults to `APP_ENV=production`.
- [x] Geolocation enabled only for same origin.
- [x] No Service Role Key included in frontend or ZIP.
- [x] No automatic checkout code or cron endpoint.
- [x] No staff selector in employee attendance screen.
- [x] Database-level unique open session per staff.
- [x] Idempotent request IDs for network retry/double click.
- [x] GPS validation implemented in database RPC for check-in and checkout.
- [x] Attendance correction and unit-location audit logs.
- [x] Late/early calculations, overnight planned time and schedule-location exception flags.
- [x] Paginated data loader; attendance UI does not rely on one global `.limit(5000)`.
- [x] Full staff profile update, primary venue transfer and temporary multi-venue assignment.
- [x] CSV attendance export and cancellation of pending employee requests.
- [x] Explicit revoke of default PUBLIC execute on HR attendance functions.
- [x] Production does not persist HR/payroll/finance/customer datasets in browser `localStorage`.
- [x] Secondary venue assignments can be ended with permission checks; only one active primary assignment is allowed.
- [x] Leave/attendance approvals require both manager scope and `hr` permission.

## Deployment validation required

The following require the user's Supabase/Vercel environment and must be tested after deployment:

- Run migration 005 successfully.
- Link first ADMIN using 006.
- Configure SMTP and invite email.
- Save real GPS position at each venue.
- Test inside/outside radius on an actual phone.
- Confirm RLS with ADMIN, MANAGER, STAFF and logged-out browser.


## SQL review

- [x] Migration wrapped in one transaction.
- [x] Legacy duplicate open records normalized before unique index creation.
- [x] No automatic checkout or data-mutating attendance cron.
- [x] Post-deploy verification SQL included.

Static QA cannot execute the migration against the user's Supabase project. Migration, RLS, email, GPS and mobile tests remain mandatory before go-live.
