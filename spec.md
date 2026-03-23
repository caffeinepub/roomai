# StagePro

## Current State
StagePro (renamed from RoomAI) has a design tool with predefined style chips (Modern, Scandinavian, Japandi, etc.). Users can pick from these but cannot create or save their own themes. Several places in the codebase still say "RoomAI" in text, constants, or filenames.

## Requested Changes (Diff)

### Add
- Custom Themes feature: logged-in users can create their own design themes (name + description prompt). Themes are stored persistently in the backend linked to their account.
- Backend: `addCustomTheme`, `getMyCustomThemes`, `deleteCustomTheme` endpoints.
- Frontend: "My Themes" section in the sidebar, below built-in style chips; a modal/dialog to create a new theme; custom themes appear as chips alongside built-in ones and can be deleted.

### Modify
- Replace all "RoomAI" references with "StagePro" in frontend files: DesignTool.tsx, LandingPage.tsx, PricingPage.tsx, and any constants/keys.

### Remove
- No features removed.

## Implementation Plan
1. Add `CustomTheme` type and stable storage to backend Motoko. Add `addCustomTheme`, `getMyCustomThemes`, `deleteCustomTheme` methods.
2. Update frontend: replace all "RoomAI" strings with "StagePro".
3. Add Custom Themes UI in DesignTool sidebar: a "+ Add Theme" button, a create-theme dialog (name + prompt), and chips for user themes with delete option.
4. Wire frontend to backend via generated bindings.
