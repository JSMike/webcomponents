commit 4c1622699119a6a3753d0adc52885f1ef5c4b628
Author: kskondov <konstantin.kondov@sap.com>
Date:   Tue Oct 13 17:06:47 2026 +0300

    feat(ui5-popover): add keyboard resize via Shift+Arrow keys (#14106)
    
    * feat(ui5-popover): add keyboard resize via Shift+Arrow keys
    
    Adds a focusable resize handle reachable via Shift+Tab that lets
    keyboard users resize the popover with Shift+Arrow keys. Direction
    is corner-aware, constrained to the viewport and opener boundary.
    
    * feat(ui5-popover): add keyboard resize via Shift+Arrow keys
    
    Fix failing tests
    
    * chore: refactor code to use the current resizing logic
    
    * test(ui5-popover): remove obsolete keyboard resize opener-anchor tests
    
    The opener-anchor constraint for keyboard resize was dropped when the
    resize logic was refactored to reuse the shared _resize() path. Remove
    the 6 tests that assert the removed behavior so the suite reflects the
    current implementation.
    
    * chore: fix keyboard handle stylings
    
    * chore: use correct wording
    
    * chore: fix initial focusing
    
    * chore: add more tests
    
    * chore: add resize guard
    
    * chore: change sample description
    
    ---------
    
    Co-authored-by: Teodor Taushanov <teodor.taushanov@sap.com>
