# Guest pages redesign – proofs of concept (2026-11-09)

Static, clickable mockups of the guest views (`webapp/views/Guest`): login, login error, 2FA, forgot password,
complete registration / reset password, request access, and request sent. Not wired to the app.

Open `index.html` in a browser and use the top bar to switch direction, screen, theme (light/dark) and viewport
(desktop/mobile). State is kept in the URL, e.g. `index.html?dir=B&screen=access&theme=dark&vp=mobile`.

## Problems with the current pages

- No title or context: the login form floats at 30% from the left with no heading, and the logo appears only on mobile.
- The vertical letter-by-letter `OPEN∞FORIS / ARENA` banner is hard to read and is the only branding on desktop.
- The background photo pulses at 20% opacity, so the page looks washed out and the form has no clear container.
- Inputs have centered text and placeholder-like floating labels; links are prefixed with a `?` icon.
- The submit button is uppercase, half-transparent green (not the theme `primary`), surrounded by empty spacers.
- Request access is one long column with a dense markdown introduction; forgot password has no title or way back.

## Directions

| | Idea | Effort |
| --- | --- | --- |
| **A · Split screen** | Brand panel (photo + blue→green overlay, pitch, feature list) on the left, plain form on the right. Collapses to a header on mobile. | Medium |
| **B · Centered card** | Same photo, static and faded into the background, one elevated card with the form, horizontal logo in the top bar. | Low |
| **C · Brand gradient** | Blue→green gradient from the logo with a "data flow" line motif, pitch on the left, frosted card on the right. | Medium |

Common to all three:

- Page title + one-line subtitle on every screen, "Back to sign in" link on secondary screens.
- Labels above left-aligned inputs, leading icons, show/hide password, "Forgot password?" next to the password label.
- Theme `primary` full-width button in sentence case; errors in an alert above the form plus red field borders.
- 2FA as six code boxes (auto-advance/paste), backup code as secondary link.
- Password strength meter with a two-column checklist.
- Request access: two-column form, "what happens next" steps instead of the long introduction, templates as cards.
- Only theme tokens (`primary`, `surface`, `outline`, ...), so light/dark and survey branding colors keep working.
