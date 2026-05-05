# Audrey AI Agent Tracker

This is the running log for the work we do in this project. I will keep it updated as tasks are requested, completed, or deferred.

## Current Focus

- Project: Memorial Space
- Current milestone: Week 1 basic 3D editor
- Stack: Vue 3 + Three.js + Supabase
- Source roadmap: [memorial_space_roadmap.txt](memorial_space_roadmap.txt)

## Active Requests

- Create a living file to track everything the user asks for throughout the project.
- Start each session by reviewing what was done yesterday and what needs to be done today.
- Explicitly confirm each time this tracker file is updated.
- Align the placeholder room toward the provided Figma reference look.
- Move the next phase away from CSS and into functional features like loading objects into the room.

## Request Log

| Date | Request | Status | Notes |
| --- | --- | --- | --- |
| 2026-05-04 | Create a tracker file for project requests and keep it updated over time. | Done | Created this file at the project root. |
| 2026-05-04 | Compile the two .gitignore files into one and update the tracker accordingly. | Done | Merged memorial-space/.gitignore into the root .gitignore and removed the duplicate file. |
| 2026-05-04 | Start week 1 project tasks and complete the first two tasks for today. | Done | Replaced the starter screen with a Three.js room scene, OrbitControls, lighting, and a responsive editor layout. |
| 2026-05-05 | Review what was done yesterday, define today's work, and keep the tracker updates explicit. | Done | Added a yesterday recap, today's checklist, and a standing note to confirm tracker updates in chat. |
| 2026-05-05 | Use the Figma screenshot as visual direction and begin replacing the placeholder look. | Done | Implemented first-pass Figma-inspired scene styling: isometric camera, pink room composition, tiled ground, top brand bar, and bottom action dock. |
| 2026-05-05 | Remove Figma workspace framing from the page and adjust screen size feel. | Done | Removed outer gray framing effect by making the editor full-bleed and borderless around the scene shell. |
| 2026-05-05 | Ensure Media/Msg/Candle buttons are visible without scrolling. | Done | Constrained the editor to viewport height and disabled shell overflow so the bottom action dock stays on-screen. |
| 2026-05-05 | Raise the room slightly in the viewport. | Done | Moved the room group upward so the composition sits a little higher on screen. |
| 2026-05-05 | Add a basic CSS foundation for fonts, colors, and branding. | Done | Added global design tokens, reusable surface/brand utility classes, and updated the document title/theme color. |
| 2026-05-05 | Set up the project font system in the root stylesheet. | Done | Added @font-face rules for Alpino and Ambella, typography tokens for the screenshot system, and utility classes for headings, body text, links, buttons, labels, small text, and quotes. |
| 2026-05-05 | Preview the Figma-inspired background color treatment. | Done | Swapped the page backdrop to the three-stop linear gradient from the screenshot for evaluation. |
| 2026-05-05 | Make the page gradient visibly show through the app shell and scene. | Done | Removed the solid shell and canvas backgrounds so the gradient is visible behind the UI and 3D area. |
| 2026-05-05 | Make the scene grid a bit more visible. | Done | Darkened the grid helper lines and made the grid fully opaque in the Three.js scene. |
| 2026-05-05 | Soften the purple in the page background gradient. | Done | Reduced the saturation and contrast of the left side so the grid stays more readable. |
| 2026-05-05 | Tune the pink in the page background gradient. | Done | Reduced the intensity of the middle gradient stop so the backdrop feels softer. |
| 2026-05-05 | Restore the previous softer background gradient. | Done | Reverted the latest pink tuning and returned to the earlier softer three-stop backdrop. |
| 2026-05-05 | Pause CSS work and shift focus to functional room features. | Done | CSS is at a good stopping point; next work should focus on loading objects into the room and related interactions. |

## Session Snapshot (2026-05-05)

### What Was Done Yesterday

- Created and initialized this tracker file.
- Consolidated duplicate .gitignore files into one root-level .gitignore.
- Implemented Week 1 foundations in the app:
	- Vue 3 + Vite project scaffold in place.
	- Three.js scene rendering in the browser.
	- OrbitControls camera interaction.
	- Lighting, floor, room shell, and responsive editor layout.

### What Needs To Be Done Today

- Load 2 to 3 GLB models into the scene.
- Create a simple asset panel listing available models.
- Add controls to place selected assets into the room.
- Keep placement state simple and local first (scene array/object list), then expand.
- Refine the new Figma-inspired look from rough match to closer model/asset parity.

### Suggested Order For Today

1. Add GLTFLoader and successfully load one model end-to-end.
2. Add two more models and normalize scaling/placement defaults.
3. Build a basic sidebar asset list linked to those models.
4. Add an "Add to scene" action per asset.
5. Confirm objects appear in scene and can be navigated with existing controls.

## Decisions

- Use this file as the single running tracker unless the user asks for a different format.
- Keep updates brief and task-oriented so it stays usable over the full project.
- Every time this file is updated, explicitly confirm it in chat so the user does not need to ask again.

## Update Format

- New request: add a row to the request log.
- In progress: mark the status clearly and add a short note.
- Completed: update the status to done and note any useful follow-up.
- Blocked: record the blocker and the next action.