-- Admin-configurable thresholds for the "متابعة زيارات اليوم" alerts page —
-- previously hardcoded (more than 3 scans in 15 minutes, more than 5 scans
-- in a day), now editable from Settings so an admin can tune them without a
-- code change.
alter table public.site_settings
  add column if not exists visit_alert_rapid_threshold integer not null default 3,
  add column if not exists visit_alert_rapid_window_minutes integer not null default 15,
  add column if not exists visit_alert_daily_threshold integer not null default 5;

alter table public.site_settings
  add constraint site_settings_visit_alert_rapid_threshold_positive
    check (visit_alert_rapid_threshold >= 1),
  add constraint site_settings_visit_alert_rapid_window_minutes_positive
    check (visit_alert_rapid_window_minutes >= 1),
  add constraint site_settings_visit_alert_daily_threshold_positive
    check (visit_alert_daily_threshold >= 1);
