# Audrey AI Agent Tracker

This is the running log for the work we do in this project. I will keep it updated as tasks are requested, completed, or deferred.

## Current Focus

- Project: Memorial Space
- Current milestone: Week 1 basic 3D editor - NEAR COMPLETE
- Stack: Vue 3 + Three.js + Supabase
- Source roadmap: [memorial_space_roadmap.txt](memorial_space_roadmap.txt)
- Status: Functional demo ready for stakeholder feedback

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
| 2026-05-05 | Build a clean top navigation bar matching the Noek website layout. | Done | Created TopNavigation.vue component with logo, nav menu items, and CTA button. Integrated into App.vue. Includes hover states, responsive design, and active link highlighting. |
| 2026-05-05 | Change "Naam" and "Edit" button text to Labels font with off-black color. | Done | Updated `.profile-area` and `.icon-button` styles in SceneCanvas to use Outfit font and #1a1a1a off-black color. |
| 2026-05-05 | Add radius and drop shadow to the top navbar. | Done | Applied border-radius: 30px and box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.2) to the .top-bar element. |
| 2026-05-05 | Inset the navbar with gaps from edges and top of page. | Done | Added margin: 20px and width: calc(100% - 40px) to .top-bar so it doesn't span full width and has space from top. |
| 2026-05-05 | Align navbar left edge with MSG button and match margins on both sides. | Done | Updated .top-bar margin to 20px 130px (top, left/right) for symmetric spacing aligned with action dock. |
| 2026-05-05 | Increase top gap to 30px on navbar. | Done | Changed .top-bar margin from 20px 130px to 30px 130px for a more spacious top gap. |
| 2026-05-05 | Reduce navbar height by adjusting padding. | Done | Changed .top-bar padding from 18px 38px to 12px 38px for a thinner navbar. |
| 2026-05-05 | Align navbar to MSG end and make it taller. | Done | Updated .top-bar margin to 30px 228px so edges align with MSG end, and increased padding to 16px 38px for more height. |
| 2026-05-05 | Clarify navbar account controls semantics. | Done | Wired username display to a reactive `username` state and kept Edit as a standalone button ready for future icon replacement. |
| 2026-05-06 | Build Week 1 demo: load 3 asset types, create asset panel, add object placement. | Done | Implemented GLTFLoader with fallback to placeholder models (Candle, Photo Frame, Flower). Created AssetPanel.vue component. Added addObjectToScene() with random placement. All 3 objects tested and rendering correctly with shadows and lighting. |
| 2026-05-06 | Add floor visibility toggle in navbar and sidebar. | Done | Added shared showFloor state, a navbar toggle next to the account controls, and a matching toggle inside the Media asset panel so the floor can be hidden or restored without losing keyboard access. |
| 2026-05-06 | Replace Edit button with avatar menu. | Done | Removed the standalone Edit button and replaced it with an accessible avatar-triggered menu that opens on click/keyboard, closes on Escape or outside click, and keeps Instellingen available inside the account area. |
| 2026-05-06 | Expand quick-action buttons into shared sidebar views. | Done | Wired Media, Msg, and Fam into one quick panel controller. Media still adds assets, Msg now shows sample messages and a compose box, and Fam shows a memorial/family action panel while keeping the floor toggle available. |
| 2026-05-06 | Convert Media flow to Foto upload/gallery wizard. | In progress | Replaced the media subchoices with Foto, Audio, and Video. Started the Foto flow with upload/gallery selection, title and text fields, plus a room placement path and hover tooltip for placed photos. |

## Session Snapshot (2026-05-06)

### What Was Done Today

- **Core Achievement:** Week 1 MVP is now functionally complete and demo-ready
- Set up GLTFLoader and asset management system in SceneCanvas.vue
- Created AssetPanel.vue component with clean UI showing 3 memorial object types:
  - 🕯️ Kaars (Candle) - with emissive flame glow
  - 🖼️ Fotolijst (Photo Frame) - wooden frame with picture
  - 🌹 Bloem (Flower) - green stem with pink petal
- Implemented `addObjectToScene()` function with:
  - GLB loader with automatic fallback to procedurally-generated 3D models
  - Random placement within the memorial space
  - Full shadow and lighting support
  - Scene state tracking via `sceneObjects` array
- Tested all three asset types - all render correctly with proper lighting
- Asset panel toggles smoothly via Media button in action dock
- Demo is now visually polished and ready for stakeholder feedback
- Added a floor visibility toggle in both the top navbar and the Media sidebar
- Reordered account controls to the requested name, avatar, edit sequence
- Replaced the separate Edit button with an accessible avatar menu containing Instellingen
- Expanded the Media/Msg/Fam buttons into a shared panel system with distinct sidebar content
- Started converting the Media panel into a Foto upload/gallery wizard with title, text, placement, and hover popup support

### Technical Implementation Details

**New/Modified Components:**
- [SceneCanvas.vue](memorial-space/src/components/SceneCanvas.vue) - Added GLTFLoader, asset management, scene state, and object placement logic
- [AssetPanel.vue](memorial-space/src/components/AssetPanel.vue) - New sidebar UI component for displaying available assets

**Key Code Additions:**
- `addObjectToScene(assetId)` - loads GLB or creates procedural fallback model
- `createPlaceholderModel(assetId)` - generates Candle, Photo Frame, and Flower using Three.js primitives
- `availableAssets` array - defines 3 asset types with metadata
- Reactive `sceneObjects` array to track placed objects
- Reactive `showAssetPanel` to toggle asset sidebar

**Next Steps (Week 2 prep):**
- Implement object selection with raycasting (click to select objects)
- Add move/rotate/delete controls for selected objects
- Show selected object details in a side panel
- Enhance asset panel with real GLB models if desired (currently using procedural fallbacks)

### What Needs To Be Done Tomorrow (Week 2 Start)

1. **Object Selection** - Raycasting to click and select objects in the scene
2. **Object Inspector** - Show selected object properties and allow editing
3. **Transform Controls** - Move, rotate, scale selected objects
4. **Delete Function** - Remove objects from scene
5. **Scene State Persistence** - Save/load scene data structure (JSON)
6. **Polish Pass** - UI refinements and edge case handling

### Suggested Order For Week 2

1. Implement mouse raycasting for object selection highlighting
2. Add keyboard shortcuts (Delete key to remove, Ctrl+C/V to copy)
3. Build an inspector sidebar showing selected object details
4. Add gizmo/transform controls (move/rotate/scale)
5. Implement basic save/load to localStorage first, then Supabase
6. Test complex scenarios (many objects, rapid placement, etc.)

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