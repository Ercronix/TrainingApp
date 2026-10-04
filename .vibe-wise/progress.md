# Learning Progress

## Pending decision
- Step 2 (home tab) implemented and tested in web build (headless Chromium); picker transparency on web fixed. Uncommitted.
- Open question for learner (awaiting reasoning): a set logged with empty weight displays "0 kg" but saves weight null; and editing set 1's weight doesn't carry to later sets. Should display/data match, and should later sets follow?

## UX: navigation and set logging
- Requirements stated by learner: split changes rarely (~monthly); logging should take less effort than type-then-check.
- Demonstrated reasoning: chose A+C to reduce actions on the frequent path; chose one-tap logging because values rarely deviate from last session; steppers because 2.5 kg matches progressive overload increments.
- Introduced (Claude explained): idempotency; existing updateExerciseLog replaces all sets (safe on replay), whereas append-style per-set requests duplicate on replay without client ids.
- Introduced (Claude explained): set checks are local draft state only until "Save & Complete" sends all sets via the offline mutation queue.
- Confirmed design (learner): home tab = active split + split picker + "Next up" (client-computed from history, hidden without history) + resume banner; no active split -> explain how to activate. Logging = prefilled rows, one-tap done, weight steppers with per-exercise step size (default 2.5 kg, +/-0.5 kg on log screen, persisted Zustand keyed by libraryExerciseId), reps steppers +/-1; each done-tap resends full done-set list via existing replace-all PUT (no backend change); client sets completed when done working sets >= plannedSets (warm-ups excluded); manual ring toggle stays.
- Claude proposals accepted by learner ("also add your proposals"): un-check recomputes completed; no-plan exercises only complete manually; zero-workout split shows add-workout hint; invalid set -> inline outline, not alert; log screen bottom button becomes "Done"; split picker activates without confirm; RPE stays a text field; split list moves to app/splits.tsx.
- Demonstrated reasoning: chose replace-all resend because it needs no backend change.
- Needs reinforcement: failure modes of debounced/offline writes (learner chose debounce without addressing the close/app-kill window; Claude proposed flush-on-close).
