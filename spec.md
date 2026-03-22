# RoomAI

## Current State
RoomAI has a Landing page, Design Tool, and Pricing page. The Design Tool allows single-image generation via Puter API.

## Requested Changes (Diff)

### Add
- New `PipelinePage` accessible via a "Pipeline" nav link in the Design Tool header
- Pipeline UI: a table/list where each row has an image URL input, a prompt textarea, and a status indicator
- Users can add/remove rows
- A "Run Pipeline" button processes all rows sequentially, calling Puter `flux.1-kontext-pro` for each
- Each row shows: input image thumbnail, prompt, status (pending/running/done/error), output image
- Results are displayed inline per row

### Modify
- App.tsx: add `pipeline` to AppView type and route to PipelinePage
- DesignTool header: add Pipeline nav link

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/PipelinePage.tsx` with pipeline UI
2. Update `App.tsx` to add pipeline view routing
3. Add Pipeline link in DesignTool header nav
