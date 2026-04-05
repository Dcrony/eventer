# CSS Architecture & Best Practices

## 📋 Overview
This document outlines the CSS architecture for TickiSpot to prevent styling conflicts and maintain consistency across components.

---

## 🎨 Centralized CSS Variables

All global CSS variables are now defined in `src/index.css` under `:root`. This prevents conflicts from multiple files redefining the same variables.

### Available Variables

```css
/* Colors */
--bg-color              /* Background color (light/dark mode aware) */
--bg-page               /* Page background */
--text-color            /* Text color (light/dark mode aware) */
--card-bg               /* Card background */
--primary-pink          /* #ec4899 - Main brand color */
--primary-dark-pink     /* #db2777 - Dark variant */
--primary-blue          /* #3b82f6 - Secondary color */

/* Gray Scale */
--gray-50 through --gray-900  /* 10-step gray palette */

/* Semantic */
--success, --warning, --error, --info

/* Spacing */
--spacing-xs through --spacing-2xl

/* Shadows, Borders, Typography, etc. */
```

### Usage Example
```css
.my-component {
  background: var(--card-bg);
  color: var(--text-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

---

## ⚠️ CSS Conflict Prevention Rules

### ✅ DO:
- Use scoped class names: `.component-name__element`
- Import component CSS from within JSX files
- Use CSS modules for isolation (when needed)
- Reference variables from `index.css`
- Test dark mode with class `dark-mode` on `body`
- Use `!important` only for form overrides (already scoped)

### ❌ DON'T:
- Define `:root` variables in component CSS files
- Use global selectors like `body`, `button`, `input` without specificity
- Hardcode colors - use CSS variables
- Use inline styles for dynamic theming
- Nest media queries beyond 2 levels deep

---

## 🏗️ Component CSS Structure

### File Naming
```
ComponentName.jsx          → component logic
css/ComponentName.css      → component styles
```

### CSS Template
```css
/* ComponentName.css */

/* ========================================
   COMPONENT NAME - DESCRIPTION
   ======================================== */

.component-name {
  /* All styles with proper scope */
}

.component-name__element {
  /* Nested elements use BEM */
}

/* Dark Mode */
.component-name.dark-mode,
body.dark-mode .component-name {
  /* Dark mode styles */
}

/* Responsive */
@media (max-width: 768px) {
  .component-name {
    /* Responsive adjustments */
  }
}
```

---

## 🎯 Known Issues Fixed in Task 1

### ✅ Centralized CSS Variables
**Problem:** Multiple files defined `:root` with conflicting variables
**Solution:** Consolidated all into `src/index.css`

### ✅ Global Selector Conflicts
**Problem:** `body` selector redefined in 4+ CSS files
**Solution:** Single definition in `index.css`, scoped variables for light/dark modes

### ✅ Dark Mode System
**Problem:** Inconsistent dark mode selectors
**Solution:** Standardized `body.dark-mode` or `.component.dark-mode` approaches

---

## 🔧 Dark Mode Implementation

### Two Valid Patterns:

**Pattern 1: Body-level (for global effects)**
```css
body.dark-mode .my-component {
  background: var(--card-bg);  /* automatically dark because :root is updated */
}
```

**Pattern 2: Component-level (for local effects)**
```css
.my-component.dark-mode {
  background: var(--card-bg);
}
```

---

## 📋 CSS Audit Checklist

Before committing new components:

- [ ] No `:root` definitions in component CSS
- [ ] No global `body`, `button`, `input` selectors without scope
- [ ] All colors use `var(--color-name)`
- [ ] Dark mode styles included
- [ ] Media queries are responsive
- [ ] Animations use `var(--transition-*)`
- [ ] Component scoped with meaningful class names
- [ ] No `!important` except for form overrides
- [ ] Tested on light AND dark modes
- [ ] Mobile-first approach (mobile classes first, then `@media (min-width)`)

---

## 📚 Files Modified in Task 1

- ✅ `src/index.css` - Centralized all CSS variables
- ✅ `src/components/css/EmptyState.css` - New empty state component
- ✅ `src/components/EmptyState.jsx` - New component using proper CSS scoping
- ✅ `src/pages/Home.jsx` - Integrated empty state and demo events

---

## 🚀 Future Recommendations

1. **Consider CSS Modules** for larger components to eliminate naming conflicts
2. **Tailwind Integration** - Use Tailwind classes more consistently
3. **CSS Preprocessor** - Add SASS/SCSS for nested structures and mixins
4. **Theme System** - Create multiple theme variants using CSS variables
5. **Component Library** - Document all reusable components with CSS specifications

---

## 📞 Questions?

Refer to this document when adding new components or troubleshooting styling issues.
