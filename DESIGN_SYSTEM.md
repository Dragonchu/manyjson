# Apple HIG Design System Implementation

This document outlines the comprehensive Apple Human Interface Guidelines (HIG) design system implementation for ManyJson.

## 🎯 Overview

The design system implements Apple's spatial design principles with:
- ✅ 8pt grid system for consistent spacing
- ✅ Apple's 16/20/24pt spacing standards
- ✅ Responsive breakpoints for different screen sizes  
- ✅ SF Pro Display/Text equivalent font stack
- ✅ Proper content hierarchy with clear visual groupings
- ✅ Updated three-panel layout in `src/views/Home.vue`

## 📐 8pt Grid System

### Base Grid Units
```css
--space-1: 4px;    /* 0.5 units */
--space-2: 8px;    /* 1 unit - base grid */
--space-3: 12px;   /* 1.5 units */
--space-4: 16px;   /* 2 units - Apple standard small */
--space-5: 20px;   /* 2.5 units - Apple standard medium */
--space-6: 24px;   /* 3 units - Apple standard large */
--space-8: 32px;   /* 4 units */
--space-10: 40px;  /* 5 units */
--space-12: 48px;  /* 6 units */
```

### Semantic Spacing Tokens
```css
--spacing-xs: 4px;     /* Tight spacing */
--spacing-sm: 8px;     /* Small spacing */
--spacing-md: 16px;    /* Default spacing */
--spacing-lg: 20px;    /* Medium spacing */
--spacing-xl: 24px;    /* Large spacing */
--spacing-2xl: 32px;   /* Extra large spacing */
--spacing-3xl: 48px;   /* Section spacing */
```

### Usage Examples
```css
/* Use semantic tokens for consistent spacing */
.component {
  padding: var(--spacing-lg);        /* 20px */
  margin-bottom: var(--spacing-md);  /* 16px */
  gap: var(--spacing-sm);           /* 8px */
}

/* Or use utility classes */
<div class="p-5 mb-4 gap-2">Content</div>
```

## 🎨 Typography Scale

### Font Stack
- **Primary**: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif
- **Monospace**: 'SF Mono', 'Monaco', 'Cascadia Code', 'JetBrains Mono', monospace

### Type Scale
| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 11px | Footnotes, fine print |
| `--text-sm` | 12px | Captions, secondary text |
| `--text-base` | 14px | Body text, UI elements |
| `--text-md` | 16px | Large body text |
| `--text-lg` | 18px | Subheadings |
| `--text-xl` | 20px | Headings |
| `--text-2xl` | 24px | Large headings |
| `--text-3xl` | 28px | Display headings |

### Semantic Typography Classes
```css
.apple-heading-1    /* 28px, bold, tight leading */
.apple-heading-2    /* 24px, semibold, tight leading */
.apple-heading-3    /* 20px, semibold, normal leading */
.apple-heading-4    /* 18px, medium, normal leading */
.apple-body         /* 14px, normal, relaxed leading */
.apple-body-large   /* 16px, normal, relaxed leading */
.apple-caption      /* 12px, normal, secondary color */
.apple-footnote     /* 11px, normal, tertiary color */
```

## 📱 Responsive Breakpoints

### Device-Specific Breakpoints
- **Large screens (1440px+)**: iMac, large displays - 400px panels
- **Standard desktop (1024-1439px)**: MacBook Pro, iMac - 350px panels  
- **Compact desktop (768-1023px)**: MacBook Air - 300px panels
- **Tablet/mobile (<768px)**: iPad, iPhone - stacked layout

### Panel Sizing
```css
--panel-width-sm: 250px;   /* Minimum panel width */
--panel-width-md: 300px;   /* Default panel width */
--panel-width-lg: 350px;   /* Large panel width */
--panel-width-xl: 400px;   /* Maximum panel width */
```

## 🎯 Touch Targets

Following Apple HIG guidelines:
```css
--touch-target-sm: 32px;   /* Small touch target */
--touch-target-md: 44px;   /* Standard touch target */
--touch-target-lg: 48px;   /* Large touch target (mobile) */
--touch-target-xl: 52px;   /* Extra large touch target */
```

## 🎨 Visual Hierarchy

### Content Grouping
- **Sections**: 48px spacing between major sections
- **Content groups**: 24px spacing between related groups
- **Elements**: 16px default spacing between elements
- **Tight spacing**: 8px for closely related items

### Layout Utilities
```css
.apple-container     /* Max-width container with padding */
.apple-section       /* Section spacing (48px bottom margin) */
.apple-content-group /* Content group spacing (24px bottom margin) */
.apple-stack         /* Vertical flex with configurable gaps */
.apple-inline        /* Horizontal flex with configurable gaps */
```

## 🏗️ Component Updates

### Updated Components
1. **Home.vue**: Enhanced resize handles with visual feedback
2. **LeftPanel.vue**: Consistent 20px padding, proper typography
3. **MiddlePanel.vue**: Grid-aligned spacing, improved card layout
4. **RightPanel.vue**: Standardized content padding and typography
5. **ContextMenu.vue**: Apple-standard menu spacing and touch targets
6. **AddFilePopup.vue**: Modal spacing following Apple guidelines
7. **FileSelectorPopup.vue**: Consistent popup layout system

### Key Improvements
- All spacing now follows 8pt grid increments
- Typography uses semantic scale with proper line heights
- Touch targets meet Apple's 44px minimum (48px on mobile)
- Consistent border radius using semantic tokens
- Proper visual hierarchy with clear content groupings

## 🎛️ Design Tokens

### Border Radius
```css
--radius-sm: 4px;      /* Small radius */
--radius-md: 8px;      /* Standard radius */
--radius-lg: 12px;     /* Large radius (cards) */
--radius-xl: 16px;     /* Extra large radius */
--radius-2xl: 20px;    /* Modal/popup radius */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.2;     /* Headings */
--leading-normal: 1.4;    /* UI text */
--leading-relaxed: 1.6;   /* Body text */
--leading-loose: 1.8;     /* Long-form content */
```

## 🚀 Migration Guide

### Before (Legacy)
```css
.component {
  padding: 16px;
  font-size: 14px;
  border-radius: 8px;
  gap: 12px;
}
```

### After (Design System)
```css
.component {
  padding: var(--spacing-lg);      /* 20px */
  font-size: var(--text-base);     /* 14px */
  border-radius: var(--radius-md); /* 8px */
  gap: var(--spacing-md);          /* 16px */
}

/* Or using utility classes */
<div class="p-5 text-base gap-4">Content</div>
```

## 🎯 Benefits

1. **Consistency**: All spacing follows Apple's 8pt grid system
2. **Scalability**: Semantic tokens allow easy theme adjustments
3. **Accessibility**: Proper touch targets and contrast ratios
4. **Responsiveness**: Device-specific optimizations for Apple ecosystem
5. **Maintainability**: Centralized design tokens reduce code duplication
6. **Future-proof**: Easy to extend with new components and patterns

## 📚 Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SF Pro Font Family](https://developer.apple.com/fonts/)
- [Apple Design Resources](https://developer.apple.com/design/resources/)