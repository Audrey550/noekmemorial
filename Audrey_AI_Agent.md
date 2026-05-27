## Session Snapshot (2026-05-27)
### Summary — Current work
- Clarified the room privacy indicator in the navbar: it is now a non-clickable padlock next to the room name with a hover/focus tooltip that says whether the room is private or public.
- Updated the tooltip copy to the more natural Dutch phrasing `Deze kamer is privé` / `Deze kamer is openbaar`.
- Fixed the tooltip visibility by allowing the room title area to overflow so the lock label is no longer clipped.
- Fixed the first-admin tutorial panel sizing so the `Gebruikersrollen` step now measures its own content and keeps the continue/rewind/skip buttons inside the visible viewport.
- Validated the tutorial panel change with a production `vite build`.
- Updated tutorial step 1 (`Welkom`) to show no spotlight, place the textbox in the exact center, and fade in on step open.
- Updated tutorial step 2 (`Gebruikersrollen`) so the profile dropdown opens automatically, the spotlight targets username + dropdown together, and the text panel is placed to the left of that target.
- Pinned the profile dropdown open while the step is highlighted, and now close it only when the tutorial controls (`Vorige`, `Volgende`, `Overslaan`) are clicked.
- Updated the roles intro copy and added a second sentence under it about where users can find settings in the dropdown.
- Updated the next tutorial step to open and spotlight the `Beheerdersinstellingen` modal itself, with the tutorial text panel fixed at the top-left.
- Refined that step so the tutorial panel is now on the right side, rendered in a compact height, and includes bullets explaining each `Beheerdersinstellingen` section.
- Tightened that step further by shrinking the spotlight radius, and lowering the compact panel height to reduce the white space above the footer buttons.
- Retargeted the spotlight from the whole admin settings modal to the `Mijn ruimtes` section inside it.
- Retargeted the spotlight again so it now follows the `Beheerdersinstellingen` title itself.
- Shifted the `Kamerinstellingen` discussion toward a fuller admin popup design with invite-code generation, private/public gating, and co-editor/co-admin role support.
- Added a Dutch-only admin tutorial draft and a reusable `TutorialOverlay.vue` component scaffold for the first-time admin flow.
- Added a `Bekijk tutorial` entry in the profile dropdown so the tutorial stays accessible from the menu instead of the navbar.
- Added a working `Kamerinstellingen` modal shell in `SceneCanvas.vue` so the profile menu item opens a visible dialog.
- Expanded the `Kamerinstellingen` modal into a full room-management UI: privacy dropdown, disabled invite-code generation while public, persistent code display, co-editor/co-admin invitation flow, member list, and a hard limit of 2 co-admins.
- Moved the `Bekijk tutorial` item underneath `Kamerinstellingen` in the profile dropdown for cleaner menu hierarchy.
- Added an account-settings room switcher so admins and invited collaborators can jump between accessible rooms from a shared `Mijn ruimtes` list.
- Added an empty-state `Nieuwe kamer maken` action to the room switcher so admins can create a room directly from Beheerdersinstellingen.
- Added a new follow-up todo to explain user roles in the tutorial round so admin/co-admin/co-editor/viewer permissions are clearer.
- Started the first full admin tutorial pass with Dutch steps for roles, room settings, invite codes, invited members, and room switching.

### Tracker Update
- 2026-05-27: Confirming `Audrey_AI_Agent.md` was updated with the latest navbar lock, tooltip, tutorial, and room-settings work.
- 2026-05-27: Tightened the first-admin tutorial panel sizing so the long `Gebruikersrollen` step stays fully visible and the footer buttons remain reachable.
- 2026-05-27: Applied step-specific tutorial placement for `Welkom`: centered panel, no element highlight, and fade-in animation.
- 2026-05-27: Applied step-specific tutorial placement for `Gebruikersrollen`: open profile menu during the step, spotlight the username/dropdown region, and position the tutorial panel left of it.
- 2026-05-27: Locked the profile dropdown open during the highlighted `Gebruikersrollen` step and close it only via tutorial controls.
- 2026-05-27: Rewrote the `Gebruikersrollen` intro text and added a second explanatory line about finding specific settings in the profile dropdown.
- 2026-05-27: Switched the following tutorial step to `Open beheerdersinstellingen`, auto-opened the admin settings modal for that step, highlighted it directly, and pinned the text panel at top-left.
- 2026-05-27: Moved the `Open beheerdersinstellingen` tutorial panel to top-right, reduced its height with compact sizing, and added explanatory bullet points for each panel area.
- 2026-05-27: Reduced the spotlight size for the `Open beheerdersinstellingen` step and shortened the compact panel height to trim whitespace before the action buttons.
- 2026-05-27: Shifted the `Open beheerdersinstellingen` spotlight from the whole panel to the `Mijn ruimtes` section.
- 2026-05-27: Shifted the `Open beheerdersinstellingen` spotlight from the section area to the `Beheerdersinstellingen` title.
- 2026-05-27: Expanded `Kamerinstellingen` into the full invite-code and co-admin flow, with privacy gating, persistent code display, and member-role management.
- 2026-05-27: Reordered the profile dropdown so `Bekijk tutorial` sits below `Kamerinstellingen`.
- 2026-05-27: Added the first-pass `Mijn ruimtes` switcher in account settings and wired room changes through `App.vue`/`SceneCanvas.vue`.
- 2026-05-27: Added a room-switcher empty-state button that opens the existing create-room flow.
- 2026-05-27: Logged a tutorial follow-up to add a dedicated user-roles explanation screen.
- 2026-05-27: Started the admin tutorial flow with a dedicated roles explanation step and concrete room-setting targets.

## Session Snapshot (2026-05-25)
### Summary — Current work
- Extended the scene placeholder generator so room furniture can render as a bookshelf, desk with lamp and computer, office chair, sofa, carpet, and a small side chair.
- Aligned the asset registry and model panel with the new ids so the room pieces can be placed from the UI even without external GLB files.
- Validated `SceneCanvas.vue` and `AssetPanel.vue` after the edits; both files are clean.
- Fixed a Vue SFC parser error caused by a bare array literal in the sofa leg setup and revalidated `SceneCanvas.vue` cleanly.
- Fixed the second Vue SFC parser error in the desk leg setup and revalidated `SceneCanvas.vue` cleanly again.
- Replaced the green room prop with a small trash can and the pink prop with a proper desk chair.
- Turned the desk chair to face the desk and scaled it up so it reads better in the scene.
- Nudged the desk chair closer to the desk, rotated it more precisely toward the desk, and made it larger again.
- Angled the desk chair a bit more away from a straight-on pose and enlarged the trash can.
- Flipped the desk chair rotation so the chair orientation is now reversed.
- Rotated the desk chair another 90 degrees from that orientation.
- Gave the chair a fixed base rotation so the wobble animation no longer overrides its facing direction.
- Rotated the chair another 90 degrees to the right by advancing its base heading to pi.
- Registered the built-in room furniture as selectable scene objects so admins can click, move, rotate, and resize them.
- Refined the sofa placeholders with fuller cushions, armrests, and lower feet so they read more like actual couches.
- Softened the sofa colors and raised roughness so the couches read more like upholstered fabric.
- Deepened the sofa seat and back cushions for a fuller, comfier couch silhouette.
- Puffier cushions: increased cushion thickness and backrest volume on both sofa builders.
- Reworked the cushions into rounded cushion groups so they read more puffy in the scene.
- Removed the circular dome from the cushions and applied the same layered volume to the back pillows.
- Made the seat cushions and back pillows fuller with taller layered profiles.
- Removed the sofa pillows entirely, leaving the couch body and back shell.
- Added recursive cleanup to deleted scene objects so geometry and materials are disposed too.
- Fixed object deletion to detach from the real parent node before disposal.
- Replaced the placeholder BRAND logo with the Noek wordmark SVG in the editor and top navigation.
- Restored the text branding and added the Noek favicon PNG to the document head.
- Reverted the favicon back to the original SVG link after the PNG version felt too small.
- Reintroduced the Noek wordmark SVG in the editor and top navigation again, and logged the favicon follow-up on the todo list.
- User clarified the logo should stay on `Noek_LogoText.svg`, so no PNG swap is needed.
| 2026-05-26 | Bring back the Noek logo text and note the favicon follow-up. | Done | Swapped the editor and site navigation branding back to `Noek_LogoText.svg` and added the favicon task to the tracker. |
| 2026-05-26 | Clarify the wordmark asset choice. | Done | Confirmed the brand should remain on `Noek_LogoText.svg` rather than `Noek_LogoText.png`. |

### Tracker Update
- 2026-05-25: Added the room-furniture placeholder models and synced the asset list with the new ids. Confirming `Audrey_AI_Agent.md` updated.
- 2026-05-25: Fixed the parser error in the default room furniture block and confirmed `SceneCanvas.vue` passes validation again.
- 2026-05-25: Fixed the matching parser error in the desk furniture block and confirmed `SceneCanvas.vue` passes validation again.
- 2026-05-25: Replaced the green triangle with a trash can and the pink stool with a desk chair in the room scene.
- 2026-05-25: Rotated the desk chair to face the desk and increased its scale for better visual balance.
- 2026-05-25: Moved the desk chair closer under the desk and adjusted the yaw so it points more directly at the work surface.
- 2026-05-26: Tilted the desk chair slightly off-axis and scaled the trash can up for better proportion.
- 2026-05-26: Flipped the desk chair rotation by 180 degrees from the previous angle.
- 2026-05-26: Turned the desk chair 90 degrees further around its vertical axis.
- 2026-05-26: Replaced the direct chair rotation with a fixed base rotation plus a tiny wobble.
- 2026-05-26: Advanced the chair base rotation to pi for one more 90-degree right turn.
- 2026-05-26: Made the default furniture clickable and editable from the scene panel.
- 2026-05-26: Reworked the sofa geometry to look more like upholstered couches.
- 2026-05-26: Tuned the couch materials toward a softer fabric finish.
- 2026-05-26: Increased cushion depth on the couch models.
- 2026-05-26: Made the couch cushions puffier.
- 2026-05-26: Rounded the cushions to improve the puffy look.
- 2026-05-26: Removed the center cushion bump and matched the back pillow volume.
- 2026-05-26: Increased the volume of the seat and back cushions.
- 2026-05-26: Removed the sofa pillows.
- 2026-05-26: Hardened object deletion with resource disposal.
- 2026-05-26: Corrected object removal to use the actual scene parent.
- 2026-05-26: Swapped the branding text for `Noek_LogoText.svg`.
- 2026-05-26: Kept the text brand and wired in `Noek_Favicon.png` as the site favicon.
- 2026-05-26: Rolled the favicon back to the original SVG.

## Session Snapshot (2026-05-22)
### Summary — End of day
- Implemented inline validation and `Opslaan` in Kamerinstellingen; room name now updates live in the top bar.
- Replaced invite-code alerts with inline success messages and improved modal styling/z-index.
- Ensured `room-updated` emits so `App.vue` can refresh admin room lists.
- Multiple UX polish items completed; remaining demo-critical tasks are listed below.

### Tomorrow (start here)
1. Smoke-test full demo flow locally (create room, invite, accept, open editor).
2. Verify role-gating with test accounts so only co-editors can reach the editor.
3. Add two demo GLB models to `public/models` and enable AssetPanel placement for demo.
4. Replace critical `alert()` usages with a simple toast component for non-blocking UX.
5. Finish visible Dutch translations and run a quick language pass.
6. Prepare fallback screenshots and a 2–3 minute demo script.

Confirmed: code changes saved in workspace; ready to continue tomorrow.

## Previous Session Snapshot (2026-05-17)
### Recap — What we achieved last time
- Week 1 MVP and media workflows: GLTFLoader/asset panel, object placement, Audio flow completed, Video flow started.
- Week 2 core interaction slice implemented: click-to-select raycasting, selection inspector, delete handling.
- Transform controls: move (6 directions), rotate, uniform scale, and UI polish (icons, layout, accessibility).
- Scene object tracking and auto-selection after placement are active and tested.
### Remaining / Open items
- Persistence: save/load scene (localStorage + Supabase integration plan).
- Gizmo-style direct drag/translate/rotate controls (visual handles) not yet added.
- Clipboard and keyboard UX: copy/paste, additional shortcuts, and keybinding polish.
- Foto & Video flows: finish any remaining Foto upload/gallery edge cases and ensure robust video recording/playback preview.
- Playback for placed media (audio/video) and upload persistence to Supabase if desired.
- Final polish and edge-case testing before stakeholder demo.
### Focus — Today (2026-05-17)
- Stabilize the Foto upload/gallery wizard and complete placement flow.
- Ensure placed audio/video playback works reliably and that video recording previews correctly.
- Implement a quick local `save/load` using `localStorage` for scene JSON (minimal API for the demo).
- Run a short browser test: place 3 objects, transform them, save, reload, verify state.
### Focus — Tomorrow (before feedback call)
- Prepare a concise 2–3 minute demo script: place a photo, add audio, move/scale, save/load.
- Freeze UI changes; fix any critical bugs found during today's tests.
- Create 3 targeted feedback questions for the teacher (persistence approach, transform UX, Supabase integration priorities).
- If time permits: add Delete key binding and a basic copy/paste workflow for objects.
### Tracker Update
- 2026-05-17: Appended session snapshot, priorities for today/tomorrow, and the short action checklist above. Confirming `Audrey_AI_Agent.md` updated.
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
| 2026-05-25 | Replace the room placeholders with screenshot-accurate furniture models. | Done | Added procedural bookshelf, desk, desk chair, sofa, carpet, and side-chair placeholders and registered their ids in both the scene and asset panel. |
| 2026-05-25 | Add a small horizontal offset to the hamburger dropdown. | Done | Shifted the dropdown 4px from the right so it lines up more naturally with the avatar edge on small screens. |
| 2026-05-25 | Align the hamburger dropdown panel with the navbar on small screens. | Done | Anchored the dropdown to the right edge of the navbar action cluster and constrained its width to viewport space so it no longer clips off-screen. |
| 2026-05-25 | Make the tablet hamburger reliably clickable. | Done | Gave the hamburger its own hit area and stacking priority so it no longer gets masked by the header layout when the bar collapses. |
| 2026-05-25 | Replace the tablet flex ordering with a more stable grid header layout. | Done | Switched the tablet breakpoint to a 3-column grid so the brand anchors left, the action cluster anchors right, and the header stops reshuffling visually while resizing. |
| 2026-05-25 | Fix the tablet header so the hamburger/avatar cluster stays aligned to the right of the brand. | Done | Removed the order mismatch in the tablet breakpoint and pinned the action cluster to the right edge so the brand stays first and the controls no longer appear swapped. |
| 2026-05-25 | Fix invalid end tag caused by the responsive header refactor. | Done | Repaired the duplicated top-bar block that had been inserted into the selection panel markup and restored the selection panel structure. |
| 2026-05-25 | Make the tablet header a single fluid cluster instead of leaving a right-side gap. | Done | Added a dedicated top-bar action group for the hamburger and avatar, and prevented the room title from acting like a spacer at tablet widths so the header compresses as one unit. |
| 2026-05-25 | Smooth the topbar collapse so the content moves with the navbar at tablet mode. | Done | Replaced the instant show/hide swap with animated width/opacity transitions for the top bar sections so the logo, hamburger, and avatar glide into place together. |
| 2026-05-25 | Move the avatar next to the hamburger at tablet size and move the username into the dropdown. | Done | Reordered the compact tablet header so the avatar sits beside the hamburger, hid the inline username on smaller screens, and surfaced the username inside the profile dropdown instead. |
| 2026-05-25 | Make the editor navbar responsive with a tablet hamburger menu. | Done | Added a hamburger-triggered dropdown for the top-nav controls in `SceneCanvas.vue` and hid the inline control row at tablet widths so the header collapses more gracefully. |
| 2026-05-25 | Apply asset button colors to specific topnav buttons. | Done | Applied the same soft gradient/border treatment from the left dock buttons to the top-nav `Vloer aan`, `Bekijk als bezoeker`, and `Privé` buttons via a `topnav-accent-button` class and active state. |
| 2026-05-25 | Make the #E8E4F5 part of the gradient more visible. | Done | Shifted the middle stop a bit higher and made the lavender band slightly stronger while keeping the same soft beige-to-lilac feel. |
| 2026-05-25 | Remove the white editor-stage block so the page gradient shows through the empty top area. | Done | Replaced the `.scene-stage` white fill with the global gradient so the background wash is visible behind the grid area. |
| 2026-05-25 | Apply the screenshot gradient to the page background. | Done | Moved the warm beige-to-lavender gradient onto the body background directly so the whole page uses the reference wash. |
| 2026-05-25 | Make the page background feel like the screenshot with the gradient behind the grid. | Done | Moved the gradient to the document-level background, made the editor frame transparent, and removed the opaque gray page fill so the gradient flows naturally behind the grid. |
| 2026-05-25 | Move the gradient behind the grid to match the Figma screenshot. | Done | Moved the warm-lilac gradient onto the editor frame and kept the outer page background neutral gray so the grid sits over the gradient like the reference. |
| 2026-05-25 | Soften the page gradient and mute the purple co-editor buttons. | Done | Updated the global page gradient to a softer warm-lilac wash and toned down the dock button colors in the scene toolbar. |
| 2026-05-25 | Remove the floor toggle from Media and Geluid. | Done | Kept the floor toggle only in the room panel so it no longer appears in the Media or Geluid views. |
| 2026-05-25 | Replace Geluid media settings with simple ambient sound presets. | Done | Added a dedicated Geluid panel with curated atmosphere presets, one-at-a-time playback, a toggle, and a volume slider; removed it from the Media workflow. |
| 2026-05-25 | Revert the models submenu back beside Assets. | Done | Restored the original side-by-side submenu layout after the stacked version pushed the submenu underneath the Assets panel. |
| 2026-05-25 | Rename Sportsbal to Voetbal. | Done | Updated the hobby sports item label to Voetbal while keeping the same placeholder object id and behavior. |
| 2026-05-25 | Reorder and rebalance the Modellen categories. | Done | Changed the order to Meubels, Apparaten, Licht, Planten, Hobby, Voertuigen; moved bike to Voertuigen, removed the lamp from Apparaten, and reshaped Hobby around music, art, and sports items. |
| 2026-05-25 | Remove the Licht button from Assets. | Done | Removed the Light shortcut from the toolbar; lamp content remains available through the Modellen flow. |
| 2026-05-25 | Move Licht away from candle behavior and show lamp models in Modellen. | Done | Routed the Licht shortcut into the models panel, added a lamp category with visible lamp placeholders, and kept save/load working for those new objects. |
| 2026-05-25 | Tune individual wall and floor textures for better stretched appearance. | Done | Adjusted each room texture with its own repeat profile so the wallpaper, brick, and wood maps fit the wall and floor planes more naturally. |
| 2026-05-25 | Fix repeating wall and floor textures. | Done | Reduced the room texture repeat defaults so wall and floor materials now stretch cleanly instead of visibly tiling. |
| 2026-05-04 | Create a tracker file for project requests and keep it updated over time. | Done | Created this file at the project root. |
| 2026-05-04 | Compile the two .gitignore files into one and update the tracker accordingly. | Done | Merged memorial-space/.gitignore into the root .gitignore and removed the duplicate file. |
| 2026-05-04 | Start week 1 project tasks and complete the first two tasks for today. | Done | Replaced the starter screen with a Three.js room scene, OrbitControls, lighting, and a responsive editor layout. |
| 2026-05-05 | Review what was done yesterday, define today's work, and keep the tracker updates explicit. | Done | Added a yesterday recap, today's checklist, and a standing note to confirm tracker updates in chat. |
| 2026-05-23 | Make the Ruimte theme tiles smaller and add wall/floor shade submenus. | Done | Reworked the room panel into a 3x3 theme grid with compact tiles and separate wall/floor shade pickers under each selected theme. |
| 2026-05-22 | Change the Assets 'Ruimte' button from room settings to wall/floor themes. | Done | Added a dedicated room theme panel, wired theme persistence into room meta, and connected the toolbar button to open the new panel. |
| 2026-05-21 | Improve the admin pre-page room cards. | Done | Replaced the plain room list with cards, added masked invite code reveal, and tuned the alignment and spacing for a less cramped admin view. |
| 2026-05-21 | Align the room card with the section title. | Done | Removed the centered card placement so the room card now starts under the heading instead of floating in the middle of the panel. |
| 2026-05-21 | Remove the remaining left inset from the room card. | Done | Set the room card to full width so it now lines up with the heading edge instead of starting indented. |
| 2026-05-21 | Refine admin topnav and room settings. | Done | Removed Save/Load from the top bar, added a visitor preview dropdown, moved Save/Load to the bottom-right dock, and simplified room settings with inline privacy/invite controls and a top-right Close × button. |
| 2026-05-21 | Align topbar and Save/Load controls. | Done | Grouped Vloer aan, View as visitor, and Private together in the header and changed Save/Load to sit side-by-side in the bottom-right dock. |
| 2026-05-21 | Simplify visitor preview toggle. | Done | Removed the visitor dropdown and changed the admin control to switch directly between View as visitor and Return to admin view. |
| 2026-05-21 | Split co-editor and admin page controls. | Done | Co-editor now sees the simplified account menu and visitor mode label, while admin-only room controls stay behind admin checks for later admin-specific work. |
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

## Recent Updates (2026-05-07)

- **2026-05-07:** Implemented the initial Audio workflow in the Media panel:
  - Added upload (device), playlist URL input, and browser recording flows in `AssetPanel.vue`.
  - Emitted `place-audio` and handled placement in `SceneCanvas.vue` with an in-scene audio card placeholder.
  - Fixed a duplicate function bug that caused a build error and corrected CSS to enable proper scrolling and spacing.
  - Polished visuals: waveform box, spacing between sections, URL placeholder, and `Start opname` button label.

- **2026-05-07 (video):** Started the Video workflow mirroring Audio:
  - Added upload, playlist URL, and camera recording UI in `AssetPanel.vue`.
  - Added `place-video` emit and a `video-details` preview with an inline `<video>` player.
  - Marked the Video UI task complete in the TODO list and started work on recording support.

If you want, I can continue by wiring playback for placed audio cards, adding deletion/posting states, or persisting uploads to Supabase.

## Recent Updates (2026-05-21)

- Updated the admin pre-page with a card-based room layout instead of the plain list.
- Added masked invite-code reveal behavior so the code stays hidden until clicked.
- Tightened the spacing and width of the room card to better match the requested 80% sizing and reduce the cramped feel.

## Recent Updates (2026-05-22)

- Reworked the Assets `Ruimte` action into a dedicated room-theme picker for walls and floor.
- Added room theme persistence so the selected look survives reloads with the room metadata.
- Confirmed `SceneCanvas.vue` and `AssetPanel.vue` are error-free after the theme wiring change.

## Recent Updates (2026-05-23)

- Reworked the room panel into a compact 3x3 theme grid.
- Added a per-theme submenu with five wall shades and five floor shades.
- Confirmed `SceneCanvas.vue` and `AssetPanel.vue` still validate cleanly after the room-theme state upgrade.

## Session Snapshot (2026-05-12)

### Session Start Review
- **Previous work status:** Week 1 MVP near completion, Foto wizard in progress, Audio complete, Video workflow started
- **Time since last session:** 6 days (May 6 → May 12)
- **Current focus:** Complete Week 1 media workflows (Foto/Audio/Video), prepare Week 2 object interaction features

### Today's Objectives
1. Review current state of Foto, Audio, and Video implementations
2. Complete Foto upload/gallery wizard fully
3. Finish Video workflow integration
4. Test all three media types in scene
5. Verify scene state tracking for placed media objects
6. Begin planning Week 2 object selection/transform controls

### What Was Completed Today

- Moved the project into Week 2 focus after confirming the media workflows were already complete.
- Added click-to-select scene object state in `SceneCanvas.vue` using the existing room raycasting path.
- Added a selection inspector panel with object type/name and a delete action.
- Normalized placed scene items so they all carry a shared scene object id for selection lookup.
- Added Delete/Backspace removal for the currently selected object.
- Added reliable selection targeting: raycasting now checks only placed scene objects (not room/furniture meshes).
- Added auto-selection after placement so the new object is instantly active in the inspector.
- Added basic transform controls in the inspector: move (forward/back/left/right) and rotate (left/right).
- Hardened keyboard delete handling to avoid deleting while typing in input/textarea fields.
- Verified in browser: placing a photo now opens the selection inspector automatically and delete works from the panel.

### Continuation: Scale Controls (May 12 - continued)

- **Objective:** Add scale (shrink/grow) controls to match the placement → positioning → rotation → scaling workflow
- **Implementation:**
  - Added `scaleStep = 0.1` constant for consistent incremental scaling
  - Updated `applyTransformToSelectedObject()` to accept `scaleAdjust` parameter
  - Scale changes use uniform scaling (all axes equally), with a minimum floor of 0.1 to prevent zero/negative values
  - Scale is stored in the scene object record for future save/load functionality
  - Added "Verkleinen" (Shrink) and "Vergroten" (Enlarge) buttons to the selection inspector panel
- **Testing:** Verified in browser - both scale buttons work:
  - Clicked "Vergroten" 3x → photo frame visibly enlarged
  - Clicked "Verkleinen" 2x → photo frame visibly shrank back down
  - Scale adjustments apply immediately and update the scene object record
- **Result:** Users can now place an object, position it (forward/back/left/right), rotate it (left/right), and scale it (shrink/grow) - complete spatial control

### UI Refinement: Icon-Based Controls (May 12 - continued)

- **Objective:** Replace text-based transform buttons with symbol-based icon buttons for a cleaner, more intuitive interface
- **Implementation:**
  - Replaced all transform button text labels with intuitive symbols:
    - **Move:** Arrow icons (↑↓←→) in a 4-button grid layout
    - **Rotate:** Curved arrows (↶↷) in a 2-button grid layout
    - **Scale:** Plus/minus circles (⊕⊖) in a 2-button grid layout
  - Organized controls into clearly labeled groups ("MOVE", "ROTATE", "SCALE") for visual hierarchy
  - Added hover effects (scale transform, background color change) for better tactile feedback
  - Removed text object labels ("Test Photo", "Type: photo") - visual highlighting via selection box is sufficient
  - Removed old text-based button styling, keeping delete button as primary action
- **Result:** Selection panel is now compact, visual, and immediately understandable without language barriers
- **Verified:** All icon buttons work correctly, delete button functional, tested rotation transform

### Vertical Movement Controls (May 12 - continued)

- **Objective:** Add up/down controls so objects don't sit halfway in the floor
- **Implementation:**
  - Added `moveY` parameter to `applyTransformToSelectedObject()` function
  - Added ⬆ (up) and ⬇ (down) icon buttons to Move section
  - Adjusted move-grid from 4 columns to 3 columns to accommodate 6 buttons in 2 rows:
    - Row 1: ↑ (forward), ↓ (backward), ← (left)
    - Row 2: → (right), ⬆ (up), ⬇ (down)
  - Vertical movement uses same `transformStep` (0.2 units) for consistent increments
- **Testing:** Verified in browser:
  - Clicked ⬆ button 3x → photo frame visibly rose above floor

## Session Snapshot (2026-05-26)
### Summary — Today
- Recited yesterday's todos and added them to the session tracker.

### Tracker Update
- 2026-05-26: Added today's todo list to the tracker and confirmed [Audrey_AI_Agent.md](Audrey_AI_Agent.md) updated.

  - Clicked ⬇ button 1x → photo frame descended slightly
  - Full vertical control achieved, no floor clipping
- **Result:** Complete 6-directional spatial control (X, Y, Z axes) plus rotation and scale

### UI Polish: Icon + Label Button Design (May 12 - continued)

- **Objective:** Make control buttons immediately understandable by combining visual symbols with descriptive text labels
- **Implementation:**
  - Updated all 10 control buttons to display both icon and label:
    - **Move:** ↑ Forward, ↓ Back, ← Left, → Right, ⬆ Up, ⬇ Down
    - **Rotate:** ↶ Left, ↷ Right
    - **Scale:** ⊖ Smaller, ⊕ Larger
  - Restructured button layout to stack icon on top of label with flexbox `flex-direction: column`
  - Updated button sizing:
    - Increased min-height to 60px to accommodate both icon and label
    - Adjusted font sizes: icon at 22px, label at 10px for clear hierarchy
  - Refined button styling: 4px gap between icon and label, uppercase styling removed from labels for readability
- **Testing:** All buttons functional with new design, hover/active states working, clear visual and textual affordances
- **Result:** Interface now perfectly balances visual design (icon symbols) with discoverability (text labels) - no guessing required

### Panel Accessibility Fix: Scrollable Selection Inspector (May 12 - continued)

- **Issue:** Scale buttons were not visible/accessible at the bottom of the selection panel
- **Solution:** Made the selection panel scrollable with improved layout
  - Increased panel width from 280px → **310px** for better button spacing
  - Added `max-height: 70vh` constraint with `overflow-y: auto` for vertical scrolling
  - Scrollbar appears naturally on the right side when content exceeds viewport
  - All 10 control buttons now accessible via smooth scrolling
- **Result:** Complete access to all controls regardless of screen height - Move, Rotate, Scale, and Delete buttons all reachable
- **User Experience:** Natural scrolling behavior, smooth transitions, no loss of functionality
- Validated the touched file with a clean error check.

### Current Focus
- **Week 2 has started**: object selection, selection UI, delete handling, and basic move/rotate controls are active.
- Next slice: optional gizmo-style dragging and richer inspector properties.

### Tracker Update Note
- `Audrey_AI_Agent.md` was updated during this session to reflect the new Week 2 focus.
## Session Progress Update (2026-05-17 â€” Active)

### Work Completed Today

**localStorage Save/Load Implementation (DONE & TESTED):**
- Implemented serializeSceneState() function: converts Three.js scene objects to plain JSON
  - Captures: id, assetId, position, rotation, scale, and all metadata (photoData, audioData, videoData, etc.)
- Implemented deserializeSceneState() function: reconstructs 3D objects from JSON
  - Handles: photo cards, audio cards, video cards, messages, 3D assets (candle/flower/frame)
  - Preserves exact transform state, auto-selects first object after load
- Added saveSceneToStorage() and loadSceneFromStorage() functions
- Added Save (ðŸ’¾) and Load (ðŸ“‚) buttons to top navbar
- **Live testing completed:**
  1. Placed "Sunset Memory" photo in scene with all transforms
  2. Clicked Save â†’ alert confirmed success
  3. Refreshed page â†’ scene memory cleared
  4. Clicked Load â†’ alert confirmed success
  5. Photo restored with correct position, rotation, scale
  6. Selection inspector re-opened with full control available
- **Result:** Full round-trip persistence working perfectly
- Ready for demo tomorrow

**Current Status:**
- localStorage provides stable save/load for the demo and teacher feedback
- Next: Optional Supabase integration (can happen after feedback call if time)
- App is now feature-complete for Week 1 + Week 2 MVP

### Remaining for Tomorrow (Before Feedback Call)

1. Demo prep: 2â€“3 minute script (place photo â†’ add audio â†’ transform â†’ save/load)
2. Polish: Fix any edge cases found in live testing
3. Feedback questions: Prepare 3â€“5 questions for the teacher about:
   - Persistence strategy (localStorage vs. Supabase)
   - Transform UX (gizmos vs. buttons)
   - Scope priorities (Supabase, copy/paste, keyboard shortcuts, etc.)
4. Optional: If time, start Supabase setup

### Tracker Update

- 2026-05-17 (Session in progress): Implemented and tested localStorage save/load, added navbar buttons, confirmed round-trip persistence works. Next: Supabase if time, otherwise demo prep tomorrow.

## Demo Script (2–3 minute)

Goal: quickly show core flows — place media, transform, save/load — to demonstrate functionality and persistence.

0:00 — Quick intro (10–15s)
- One-line purpose: "This is the Memorial Space editor — place memories into a shared room and persist the scene." 

0:15 — Place a photo (30–45s)
- Open Media → Foto → choose a sample (e.g., Sunset.jpg). Add a title like "Sunset Memory" and click `Plaatsen`.
- Show the placed photo in the scene, point out auto-selection and the inspector panel.

0:50 — Transform a placed object (30s)
- Use Move (Forward/Back/Left/Right/Up/Down) to position the photo.
- Rotate once or twice and click Larger to scale up — show immediate visual update.

1:20 — Add audio (20–30s)
- Open Media → Audio → upload or choose sample → place into the room.
- Click the audio card and demonstrate playback (if implemented) or note it's placeholder for now.

1:45 — Save and reload (30–45s)
- Click `💾 Save` (top bar) — note success alert.

## Wrap-up (2026-05-26)

- **Status:** User wrapping up for the day and will commit latest changes locally.
- **Notes:** Branding/logo edits completed; logo class rename applied; small CSS tweak added so the SVG wordmark renders correctly.

## Next Session Plan (Start of next working session)

Planned priorities for the next session (as requested by the user):

1. **Make Save/load function actually function** — verify & fix persistence flows (localStorage → optional Supabase integration), test round-trip save/load for multiple objects and media types. (Status: not-started)
2. **Co-editor: implement first-time tutorial** — add an onboarding flow for co-editors that explains basic placement, transform, and save/load. (Status: not-started)
3. **Co-editor: start visitor side features** — begin building the visitor preview mode and limited-interaction behavior. (Status: not-started)

I updated the project todo list with these items so we can track progress. Once you've committed the latest changes, I can start on task (1) immediately and report back with progress updates.
- Refresh the page to simulate returning later (optional: do this live).
- Click `📂 Load` — show scene restored with photo/audio and transforms intact.

2:20 — Closing (10–20s)
- Ask for feedback: "Does this flow match expectations? Would you prefer gizmo drag handles instead of buttons for transforms?"

Quick smoke-test checklist (before call):
- Place a photo, move, rotate, scale, save, reload → verify all transforms persist.
- Place audio, save, reload → verify audio card restored (and playback if implemented).
- Verify Delete key removes selected object (if added) and inspector remains stable.

Three targeted feedback questions for the teacher:
1. Persistence: prefer localStorage prototype for demo or should I prioritise Supabase-backed scenes for the final demo?
2. Transform UX: are button-based transforms acceptable, or should I implement gizmo-style drag handles first?
3. Scope: which features matter most next — Supabase integration, copy/paste & keyboard shortcuts, or improved media upload/processing?

---

Confirmed: demo script appended and todo updated.

## Session Snapshot (2026-05-18)
### Recap — Yesterday's achievements
- Local `save/load` via `localStorage` implemented and tested (round-trip restore verified).
- Foto/Audio/Video flows are present; Video recording work remains in progress.
- Object selection, inspector, and full transform controls (move/rotate/scale/delete) are working.
- Asset panel, GLTFLoader, and placement flow are stable for the demo.

### Tonight (before 19:00) — Timeboxed options
- Option 1 — Quick demo polish & login UI (fast): implement a simple login page (email-only mock or local), tie a user state to `localStorage`, and run smoke-tests. Est. 60–90 min.
- Option 2 — Supabase initialization (medium): create a Supabase project, add a `users` table, configure `@supabase/supabase-js` client in the app, and add environment variables. Est. 90–150 min.
- Option 3 — Supabase auth + access control (ambitious): wire Supabase email auth (magic-link or email+password), create `rooms` and `invitations` tables, and implement basic room rules (admin/co-editor/viewer). Est. 2–3+ hours.
- Option 4 — Access control UI (medium): add room privacy toggle, invite-code generation UI, and a placeholder email-invite flow (no outbound email). Est. 60–120 min.

### Recommended pick for tonight
- If you want Supabase groundwork now: pick Option 2 (init) + optionally start Option 3 if time remains.
- If you prefer fastest visible progress for the meeting: pick Option 1 (login UI mock) + Quick smoke-test (save/load). This gives a presentable auth flow without external setup.

I updated this tracker and created a focused todo list for tonight. Tell me which option(s) you want me to start and I'll begin immediately.

---
Tracker updated: 2026-05-18 — appended session snapshot and tonight options.

### Progress (2026-05-18, in-session)
- Started Option 1: implementing mock/local login UI. Added `Login.vue` and wired local auth state in `App.vue`. User can choose role (`admin`, `editor`, `viewer`) and persist to `localStorage` for the demo.
 - Completed Option 1: Login mock finished and role-based flows wired.
   - `Login.vue`: role-specific fields (admin: password, editor: invite code, viewer: email), avatar generation, displayName.
   - `App.vue`: admin room-list flow (localStorage-backed demo rooms), create/delete rooms, open room flows.
   - `SceneCanvas.vue`: accepts `currentUser` + `roomId`, shows `username` and avatar, blocks viewers from adding objects, and adds room privacy toggle + invite-code generation (localStorage-backed demo).

Next: Quick smoke tests of the login → open editor flow, then begin Supabase client setup if all looks good.
 
### Smoke test (2026-05-18)
- Action: programmatically exercised the app in the dev server: logged in as admin, opened Media → Foto, placed a sample photo, used Save, reloaded, and used Load. 
- Result: success — placed object restored after save/load. Admin-only controls (privacy, invite generation) visible. Viewers are blocked from adding objects. 
- Tracker/Todo: marked quick smoke-test complete. Ready to start Supabase init next.

## Session Snapshot (2026-05-22, evening)

### Request Logged
- User asked for: clear recap of what was achieved today, what remains, and best focus for tonight.
- User preference reaffirmed: keep this tracker updated throughout the full project.

### What Was Achieved Today
- Room-management flow was improved in the admin pre-page:
  - Better room create/update handling in `App.vue`.
  - Local persistence for room list and room metadata (name/privacy/invite code).
- Invite onboarding UI was improved:
  - Invite avatar step got image-preview and styling improvements.
  - Invite loading screen now includes room name and improved loading visuals.
- Room settings UX in editor improved:
  - Inline validation/success feedback in Kamerinstellingen.
  - Room name updates reflected in top bar.
  - `room-updated` event path in place so admin list can refresh.
- Localization pass started and mostly applied in working tree:
  - Dutch labels for login/admin/editor controls and transform tooltips/buttons.

### Current State Right Now
- Today has multiple commits on `main` covering room-management and invite/admin UX refinements.
- There are still uncommitted changes in progress:
  - `memorial-space/src/App.vue`
  - `memorial-space/src/components/AssetPanel.vue`
  - `memorial-space/src/components/Login.vue`
  - `memorial-space/src/components/SceneCanvas.vue`

### What Still Needs To Be Done
1. Finish and verify the Dutch language pass (remove remaining mixed EN/NL labels and alerts).
2. Smoke-test full role flow end-to-end:
   - admin login → room list → open editor → room settings save
   - co-editor invite flow → onboarding → editor access
   - viewer mode restrictions
3. Stabilize admin page layout details (spacing/alignment/responsive behavior).
4. Prepare 3D asset handoff path:
   - Add at least 2 real demo GLB files under `public/models`
   - Register them in the asset panel and confirm placement/selection/save-load roundtrip
5. Replace remaining blocking alerts with inline feedback/toast behavior where feasible.

### Best Focus For Tonight (Recommended)
- Primary recommendation: continue with Admin page layout polish first, but timebox it to 60-90 minutes.
- Then move immediately to one thin 3D implementation slice tonight:
  - import one real GLB model,
  - show it in AssetPanel,
  - place it in scene,
  - save/load it successfully.

Why this order:
- A clean admin shell reduces friction for testing roles/invites.
- One real GLB in production path de-risks the next milestone much more than pure layout work.

### Tonight Plan (Practical Sequence)
1. Admin layout polish pass (desktop + mobile checks).
2. Commit layout changes.
3. Add first real GLB integration and verify placement.
4. Quick regression smoke test for save/load and role gating.
5. Commit again with a short demo-ready message.

---
Tracker updated: 2026-05-22 evening snapshot added with achievements, open work, and tonight recommendation.

## Session Update (2026-05-22, late evening)

- Admin editor layout pass started based on provided MedFi screenshot reference, but adapted to Memorial Space styling.
- `SceneCanvas.vue` was restyled to a cleaner editor chrome:
  - compact top utility controls,
  - brand block on top-right,
  - vertical quick-action dock on the left,
  - bottom-centered compact save/load dock,
  - softened scene background to match existing project palette.
- A temporary Vue template mismatch occurred during refactor (`Invalid end tag` in `SceneCanvas.vue`).
- Hotfix applied immediately by removing one extra closing `</div>` in the header block.
- Validation:
  - file diagnostics clean,
  - `npm run build` completed successfully.

Tracker updated: 2026-05-22 late-evening layout pass and compile hotfix logged.

## Session Snapshot (2026-05-23)

- Added a models submenu UI to `AssetPanel.vue`: category buttons now show a selectable grid of models for the chosen category with a `Plaatsen` button to insert objects into the scene (emits `add-asset`).
- Wired placement action to the existing `addObjectToScene()` flow in `SceneCanvas.vue` (uses GLTFLoader with placeholder fallback).
- Updated tracker and TODOs to start the GLB/model integration work (next: add two demo GLB files to `public/models` and register them in `availableAssets`).

If you'd like, I can add 2 lightweight demo GLB files to `memorial_space/public/models` next and register them in the asset list so real models appear in the panel.

Update (2026-05-23): Adjusted Models panel behavior per user request — categories now appear in a left column and selecting a category opens a separate submenu panel on the right with model thumbnails and `Plaatsen` buttons. This matches the two-column master-detail flow from the MedFi screenshot while keeping the existing app layout.

Update (2026-05-23, revision): Implemented the requested separate submenu behavior — clicking a category now opens a distinct submenu container next to the `Modellen` container (separate panel) instead of rendering items inside the same panel. This restores the visual separation and master/detail flow you wanted. Next: style the submenu to match the MedFi screenshot or add demo GLB files.

- Added two lightweight procedural placeholder models for the `Meubels` category: `chair_01` (Stoel) and `table_01` (Bijzettafel). These are implemented in `SceneCanvas.vue`'s `createPlaceholderModel()` and are registered in the `availableAssets` list so they can be placed immediately from the Modellen submenu. They are intentionally simple (box-based) so they remain lightweight; we can replace them with real `.glb` files later.

Update (2026-05-23, submenu placeholder items): Expanded the `Modellen` submenu into real placeholder cards per category. The right-side submenu now shows actionable items with name, short description, icon, and a `Plaatsen` button so the admin can begin populating the room immediately while the final GLB assets are still pending.

Update (2026-05-23, submenu reposition): Moved the Models submenu wrapper back to the left side so it sits next to the `Assets` container again, matching the original layout direction instead of floating beside the `Modellen` panel.

Update (2026-05-23, submenu spacing): Nudged the Models/submenu wrapper further to the right so it aligns more naturally beside the `Assets` container and leaves a clearer gap from the left edge.

Update (2026-05-23, vertical centering): Shifted the full asset strip to vertical center alignment so the `Assets` panel, `Modellen` panel, and submenu line up on the same midline instead of sitting at different heights.

Update (2026-05-23, equal spacing): Increased the horizontal gap between the `Modellen` panel and submenu to match the spacing between `Assets` and `Modellen` more closely.

Update (2026-05-23, container spacing correction): Shifted the whole Models/submenu group slightly left so the outer container spacing lines up more naturally with the `Assets` panel instead of only changing the gap inside the Models group.

Update (2026-05-23, submenu readability): Darkened the `Terug` button inside the Models submenu so it stays readable on the light submenu background.

Update (2026-05-23, object color control): Added a color section to the selected-object inspector in `SceneCanvas.vue`. The admin can now recolor colorable objects with preset swatches or a custom color input, and the chosen color is stored in the scene state so it survives save/load.

Update (2026-05-23, inspector layout): Moved the selection panel upward so it sits above the Save/Load dock instead of overlapping it, and resized the `Rotatie` and `Schaal` button grids so they match the `Verplaatsen` button sizing rhythm.

Update (2026-05-23, topnav background): Removed the warm/yellowish tint from the page and editor stage backgrounds by switching them to a cooler neutral gradient, so the area behind the top navigation reads cleaner and lighter.

Update (2026-05-23, topnav cleanup): Flattened the page and editor-stage backgrounds to plain white so there is no visible gradient strip behind the top navigation bar.

Update (2026-05-23, topnav spacing): Increased the top bar's vertical margin so the editor has a bit more breathing room beneath the header.

Update (2026-05-23, topnav shell removed): Made the top navigation container transparent and removed its border/shadow/radius so the header no longer appears as a separate bar.

Update (2026-05-23, topnav restored): Brought the top navigation bar shell back, but kept it slimmer so it stays visible without crowding the editor options underneath.

Update (2026-05-23, asset panel switching): Changed the left-toolbar panel switching so opening a different asset category closes the current panel first and then reopens the new one, avoiding the old panel lingering behind the new content.

## Session Snapshot (2026-05-23 — Theme & Textures)

- UI: Increased texture thumbnail size to 80×80 and set `background-size: cover` so thumbnails do not zoom or crop unexpectedly; active theme selection now uses a visible box-shadow/border rather than an overlay.
- Controls: Added `Kleur / Textuur` toggle and admin-only `Use color` toggle (only visible to admins when textures are enabled). Thumbnails show horizontally only in Textuur mode.
- Scene wiring: Introduced `useTextures` and `useColor` flags on the room theme state; `SceneCanvas.vue` normalizes these fields for backward compatibility and persists them to `localStorage`.
- Materials: Loader now respects per-texture `repeat: [x,y]` values (defaults provided); support added for non-repeating rug textures (`repeat: [1,1]`) per request.
- Lighting and preview parity: Added an explanatory tooltip noting thumbnails are unlit previews while the scene is lit; when `useColor === false` the material color is set to a neutral tint and roughness is increased slightly to avoid over-brightness under scene lighting.
- Bugfix: Resolved `ReferenceError: floorVariant is not defined` by declaring `wallVariant` and `floorVariant` early in `applyRoomTheme()` and removing duplicate declarations — scene rendering restored.
- Follow-ups: Fine-tune per-texture repeat values (esp. rugs/floor planks) and optionally replace native `title` tooltip with an accessible styled popover.

Files changed in this slice: `memorial-space/src/components/AssetPanel.vue`, `memorial-space/src/components/SceneCanvas.vue`, and supporting CSS in the project stylesheet. Ready for your commit when you are.

