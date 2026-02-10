# Mobile Responsive Pattern Guide

## ✅ Already Mobile Responsive
- `/auth/*` - All auth pages
- `/underdeacon/attendance` - Attendance register with accordion
- `/underdeacon/dashboard` - Dashboard
- `/members` - Member management (cards on mobile, table on desktop)

## 🎨 Mobile-First Design Pattern

### 1. Container/Wrapper
```tsx
// OLD (Desktop-only)
<div className="p-6 max-w-7xl mx-auto">

// NEW (Mobile-first)
<div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
```

### 2. Headers
```tsx
// OLD
<h1 className="text-2xl font-bold">Title</h1>

// NEW (Mobile-first with bold)
<h1 className="text-xl sm:text-2xl md:text-3xl font-black">Title</h1>
<p className="text-sm sm:text-base text-gray-600">Subtitle</p>
```

### 3. Buttons
```tsx
// OLD
<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">

// NEW (Full-width on mobile)
<button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm sm:text-base">
```

### 4. Search/Input Fields
```tsx
// OLD
<input className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />

// NEW (Smaller, bolder)
<input className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-300 rounded-lg font-medium" />
```

### 5. Tables → Cards on Mobile
```tsx
{/* Mobile Card View */}
<div className="block md:hidden space-y-3">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-lg border-2 border-gray-200 p-3">
      {/* Card content */}
    </div>
  ))}
</div>

{/* Desktop Table View */}
<div className="hidden md:block bg-white rounded-xl shadow-sm border-2 border-gray-200">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

### 6. Stats/Metrics Cards
```tsx
// OLD
<div className="grid grid-cols-3 gap-4">

// NEW (Responsive grid)
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
  <div className="bg-blue-50 p-2.5 sm:p-3 md:p-4 rounded-lg border-2 border-blue-300">
    <span className="text-xs sm:text-sm font-black uppercase">Label</span>
    <p className="text-xl sm:text-2xl md:text-3xl font-black">Value</p>
  </div>
</div>
```

### 7. Flex Layouts
```tsx
// OLD
<div className="flex justify-between items-center gap-4">

// NEW (Stack on mobile)
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
```

## 🎯 Key Principles

1. **Mobile-First**: Start with mobile (`p-3`), scale up (`sm:p-4 md:p-6 lg:p-8`)
2. **Bold Typography**: Use `font-black` for headers, `font-bold` for labels
3. **High Contrast**: Use `border-2` instead of `border` for definition
4. **Compact Spacing**: Reduce gaps on mobile (`gap-2 sm:gap-3 md:gap-4`)
5. **No Horizontal Scroll**: Always use `overflow-x-hidden` on containers
6. **Responsive Text**: Scale font sizes (`text-sm sm:text-base md:text-lg`)
7. **Truncate Long Text**: Use `truncate` class to prevent overflow
8. **Full-Width Buttons**: On mobile, buttons should be `w-full sm:w-auto`

## 📋 Checklist for Each Page

- [ ] Update container padding: `p-3 sm:p-4 md:p-6 lg:p-8`
- [ ] Make headers responsive: `text-xl sm:text-2xl md:text-3xl font-black`
- [ ] Stack flex layouts on mobile: `flex-col sm:flex-row`
- [ ] Convert tables to cards on mobile: `block md:hidden` / `hidden md:block`
- [ ] Make buttons full-width on mobile: `w-full sm:w-auto`
- [ ] Bold all text: `font-bold` or `font-black`
- [ ] Use stronger borders: `border-2`
- [ ] Add responsive grids: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- [ ] Truncate text where needed: `truncate`
- [ ] Test on mobile viewport (375px width)

## 🚀 Quick Template

```tsx
export default function Page() {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">Page Title</h1>
          <p className="text-sm sm:text-base text-gray-600">Page description</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold">
          Action
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {/* Your content here */}
      </div>
    </div>
  );
}
```
