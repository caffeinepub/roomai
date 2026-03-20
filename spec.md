# RoomAI

## Current State
DesignTool is a single-window chat-style interface with room type and style selectors. No sidebar tool categories exist.

## Requested Changes (Diff)

### Add
- Left sidebar with all AI transformation tools grouped by category
- Tools: Add Furniture, Furniture Eraser, Room Decluttering, Enhance Photo Quality, Material Overlay, Virtual Twilight, Changing Seasons, Pool Water Enhancement, Lawn Replacement, Night to Day, Rain to Shine, Natural Twilight, Add Water to an Empty Pool, AI Holiday Card, Multi-Angle Staging, AI Design Agent, AI Virtual Tour, AI 360° Panorama Beta
- Each tool has a unique AI prompt
- Active tool is highlighted in sidebar
- AI 360° Panorama Beta has a "Beta" badge

### Modify
- DesignTool layout: add collapsible left sidebar
- Prompt generation to use the selected tool's specific prompt
- Bottom bar input reflects the active tool

### Remove
- Nothing removed

## Implementation Plan
1. Define TOOLS array with name, icon, group, description, and prompt template
2. Add sidebar column to DesignTool layout
3. Connect tool selection to prompt generation
4. Style sidebar with white theme, active state highlight
