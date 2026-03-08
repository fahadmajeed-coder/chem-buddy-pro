
**Plan to remove the reset order button:**

1. **`src/components/layout/AppSidebar.tsx`**:
   - Locate the "Reset order" button (with the `RotateCcw` icon) in the sidebar navigation header.
   - Remove the button element completely.
   - Clean up the `resetOrder` helper function since it will no longer be used.
   - Remove the `RotateCcw` icon from the `lucide-react` imports to keep the code clean.
