# ManyJson Apple HIG Optimization - Linear Issues Breakdown

## Issue 1: Theme Foundation & Light/Dark Mode System
**Labels:** `design-system`, `theming`, `high-priority`  
**Estimate:** 3-5 days  
**Parent Issue:** LC-29

### Description
Create a comprehensive theme system supporting both light and dark modes with Apple HIG color tokens to replace the current Linear-inspired dark design.

### Acceptance Criteria
- [ ] Replace current Linear color variables with Apple system colors
- [ ] Implement semantic color tokens (primary, secondary, tertiary text colors)
- [ ] Add Apple's standard accent colors: blue (#007AFF), green (#34C759), red (#FF3B30)
- [ ] Create theme switching mechanism with proper state management
- [ ] Ensure WCAG accessibility compliance for color contrast
- [ ] Update CSS custom properties in `src/style.css`
- [ ] Add theme persistence (localStorage/preferences)

### Technical Notes
- Current file: `src/style.css` uses Linear color scheme
- Need to update all `--linear-*` CSS variables to Apple equivalents
- Integrate with existing `useUIStore` for theme state management

---

## Issue 2: Core UI Components Redesign
**Labels:** `components`, `design-system`, `high-priority`  
**Estimate:** 5-7 days  
**Parent Issue:** LC-29  
**Depends on:** Issue 1 (Theme Foundation)

### Description
Refactor all interactive components to match Apple HIG specifications with proper sizing, styling, and interaction patterns.

### Acceptance Criteria
- [ ] **Buttons**: Implement filled, tinted, bordered, and plain button styles
- [ ] Ensure 44pt minimum touch target for all interactive elements
- [ ] **Form Controls**: Redesign text fields, search bars, and input validation states
- [ ] **Selection Controls**: Update checkboxes, radio buttons, and segmented controls
- [ ] **Progress Indicators**: Add Apple-style progress bars and activity indicators
- [ ] **List Components**: Implement proper list row styling with disclosure indicators
- [ ] Update existing components: `StatusBar.vue`, `ContextMenu.vue`

### Technical Notes
- Components to update: All 11 Vue components in `src/components/`
- Focus on `AdvancedJsonEditor.vue`, `RightPanel.vue`, `LeftPanel.vue`
- Maintain existing functionality while updating visual design

---

## Issue 3: Layout System & Grid Implementation
**Labels:** `layout`, `design-system`, `medium-priority`  
**Estimate:** 2-3 days  
**Parent Issue:** LC-29

### Description
Establish Apple's spatial design principles with proper grid system, spacing, and typography following HIG standards.

### Acceptance Criteria
- [ ] Implement 8pt grid system for consistent spacing
- [ ] Define proper margins and padding following Apple's 16/20/24pt standards
- [ ] Create responsive breakpoints for different screen sizes
- [ ] Establish typography scale using SF Pro Display/Text equivalent fonts
- [ ] Implement proper content hierarchy with clear visual groupings
- [ ] Update main layout in `src/views/Home.vue`

### Technical Notes
- Replace current font stack with Apple system font equivalents
- Update spacing throughout the three-panel layout
- Ensure consistent visual hierarchy

---

## Issue 4: Navigation Architecture Redesign
**Labels:** `navigation`, `layout`, `high-priority`  
**Estimate:** 4-6 days  
**Parent Issue:** LC-29  
**Depends on:** Issue 3 (Layout System)

### Description
Redesign the current three-panel layout to follow Apple navigation patterns with proper menu structure and user flow.

### Acceptance Criteria
- [ ] **Menu Bar**: Create global application menu with standard File/Edit/View/Window menus
- [ ] **Toolbar**: Implement context-aware toolbar with primary actions
- [ ] **Sidebar**: Transform LeftPanel into collapsible sidebar with proper navigation hierarchy
- [ ] **Breadcrumb Navigation**: Add path indicators for deep navigation
- [ ] **Tab System**: Implement document tabs for multiple file management
- [ ] Maintain current three-panel functionality while improving UX

### Technical Notes
- Major refactoring of `src/views/Home.vue`
- Update `LeftPanel.vue`, `MiddlePanel.vue`, `RightPanel.vue`
- May require new navigation components

---

## Issue 5: Animation & Motion Design
**Labels:** `animations`, `ux`, `medium-priority`  
**Estimate:** 3-4 days  
**Parent Issue:** LC-29  
**Depends on:** Issues 2, 4 (Components & Navigation)

### Description
Integrate Apple's motion design principles with smooth transitions, micro-interactions, and feedback animations.

### Acceptance Criteria
- [ ] Replace current transitions with Apple's easing curves (ease-in-out, spring animations)
- [ ] Add view transition animations for panel switching
- [ ] Implement hover states and button press feedback
- [ ] Create smooth loading states and skeleton screens
- [ ] Add contextual animations for state changes (validation, file operations)
- [ ] Update `--linear-transition` variables to Apple-style timing functions
- [ ] Ensure 60fps performance on animations

### Technical Notes
- Update CSS transition variables in `src/style.css`
- Add Vue transition components for view changes
- Consider using CSS transforms for performance

---

## Issue 6: Responsive Design System
**Labels:** `responsive`, `layout`, `medium-priority`  
**Estimate:** 2-3 days  
**Parent Issue:** LC-29  
**Depends on:** Issue 3 (Layout System)

### Description
Ensure proper scaling across different display sizes from 13" to 27"+ displays with adaptive layouts.

### Acceptance Criteria
- [ ] Implement fluid typography scaling
- [ ] Create adaptive layouts that work from 13" to 27"+ displays
- [ ] Add window resizing behavior that maintains proportions
- [ ] Implement proper minimum window sizes
- [ ] Test and optimize for different pixel densities (1x, 2x, 3x)
- [ ] Update Electron window configuration for proper scaling

### Technical Notes
- Update `electron/` configuration for window management
- Test on various screen resolutions and pixel densities
- Ensure resize handles work properly across different scales

---

## Issue 7: Data Visualization Enhancement
**Labels:** `data-viz`, `components`, `medium-priority`  
**Estimate:** 3-4 days  
**Parent Issue:** LC-29  
**Depends on:** Issues 2, 3 (Components & Layout)

### Description
Update current JSON display components with Apple-style data presentation patterns.

### Acceptance Criteria
- [ ] Transform current file list into Apple-style List View with proper row styling
- [ ] Implement Grid Layout option for schema/file browsing
- [ ] Create Card-based design for file previews and schema information
- [ ] Add proper sorting, filtering, and search functionality
- [ ] Implement disclosure triangles and expandable content
- [ ] Update `JsonHighlight.vue`, `JsonDiffViewer.vue`

### Technical Notes
- Focus on `MiddlePanel.vue` for file list improvements
- Update JSON syntax highlighting to match Apple's code editor styles
- Ensure proper data hierarchy visualization

---

## Issue 8: System-Level Components
**Labels:** `system-ui`, `components`, `low-priority`  
**Estimate:** 2-3 days  
**Parent Issue:** LC-29  
**Depends on:** Issues 1, 2 (Theme & Components)

### Description
Implement missing system components following Apple's interface patterns for desktop applications.

### Acceptance Criteria
- [ ] **Enhanced Status Bar**: Move from current toast to proper status bar with multiple zones
- [ ] **Notification System**: Create in-app notification center for operations feedback
- [ ] **Modal System**: Standardize all popups to use Apple-style modal presentations
- [ ] **Drawer Panels**: Implement slide-out panels for secondary actions
- [ ] **Context Menus**: Enhance current context menu with Apple styling and behavior
- [ ] Update `AddFilePopup.vue`, `FileSelectorPopup.vue`, `AddSchemaDialog.vue`

### Technical Notes
- Current `StatusBar.vue` needs complete redesign
- `ContextMenu.vue` needs Apple-style visual treatment
- All modal components need consistent presentation layer

---

## Issue 9: Accessibility & Keyboard Navigation
**Labels:** `accessibility`, `a11y`, `medium-priority`  
**Estimate:** 2-3 days  
**Parent Issue:** LC-29  
**Depends on:** Issues 2, 4 (Components & Navigation)

### Description
Ensure the application meets Apple's accessibility standards with proper keyboard navigation and screen reader support.

### Acceptance Criteria
- [ ] Implement proper keyboard navigation throughout the app
- [ ] Add VoiceOver/screen reader support with semantic markup
- [ ] Ensure all interactive elements meet 44pt minimum touch target
- [ ] Add focus indicators and high contrast mode support
- [ ] Implement proper error messaging and user guidance
- [ ] Add ARIA labels and roles where needed
- [ ] Test with macOS accessibility features

### Technical Notes
- Add proper `tabindex` and `aria-*` attributes
- Implement focus trap for modal dialogs
- Ensure keyboard shortcuts follow macOS conventions

---

## Issue 10: Performance Optimization & Final Polish
**Labels:** `performance`, `polish`, `low-priority`  
**Estimate:** 1-2 days  
**Parent Issue:** LC-29  
**Depends on:** All previous issues

### Description
Final optimization and integration to ensure smooth performance and visual consistency across platforms.

### Acceptance Criteria
- [ ] Optimize theme switching performance
- [ ] Ensure smooth animations on lower-end hardware
- [ ] Test cross-platform consistency (macOS focus but Linux/Windows compatibility)
- [ ] Final visual polish and edge case handling
- [ ] Performance audit and optimization
- [ ] Documentation updates for new design system

### Technical Notes
- Profile animation performance and optimize if needed
- Test on different hardware configurations
- Ensure Electron app feels native on macOS

---

## Implementation Timeline

**Total Estimated Time:** 25-37 days

**Phase 1 (Foundation):** Issues 1-3 (7-10 days)
**Phase 2 (Core Features):** Issues 4-5 (7-10 days)  
**Phase 3 (Enhancement):** Issues 6-8 (7-10 days)
**Phase 4 (Polish):** Issues 9-10 (4-7 days)

## Dependencies Graph
```
Issue 1 (Theme) → Issues 2, 8
Issue 3 (Layout) → Issues 4, 6, 7
Issue 2 (Components) → Issues 5, 7, 9
Issue 4 (Navigation) → Issue 5, 9
All Issues → Issue 10 (Final Polish)
```

Copy each issue section above into Linear as a separate issue, making sure to:
1. Set the parent issue as LC-29
2. Add the specified labels
3. Set the time estimates
4. Link dependencies between issues
5. Assign appropriate priority levels