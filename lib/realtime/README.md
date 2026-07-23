# Realtime

Supabase Realtime (Broadcast + Presence) client and the room/session
abstractions built on it: room creation/join-by-code, reconnection and host
migration (ADR-0001 §4). Games never import the Realtime client directly —
they consume this layer through the platform.
