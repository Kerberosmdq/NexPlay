# Analytics

The single `track(event)` function and the durable `events` writes it wraps
(ADR-0003, Seam 2). Events are enums and numbers only — never names or free
text (see the privacy posture in ADR-0003).
