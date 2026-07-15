-- Serve employee photos the exact same way the header logo/branding assets
-- are already served: a plain, permanent public Storage URL, not a signed
-- URL and not a server-side proxy. Both of those still required the
-- browser to either request a fresh signature or hit a separate endpoint,
-- and some in-app browsers (Snapchat, Instagram, etc.) proved unreliable
-- at one or both. A plain public URL has no expiry and no moving parts —
-- it's the same mechanism already proven to work everywhere for
-- branding-assets.
--
-- The object path is "<public_token>/photo", where public_token has 128
-- bits of entropy (see generate_public_token()) — the same token already
-- required to view the rest of the certificate at /e/:token, so making the
-- photo world-readable-by-path does not expose anything beyond what that
-- link already exposes today.
update storage.buckets
set public = true
where id = 'employee-photos';
