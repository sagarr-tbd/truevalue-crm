# TruevalueCRM

A modern, full-featured Customer Relationship Management (CRM) system built with Next.js 14, TypeScript, and Tailwind CSS.

## 📚 Documentation

**Complete documentation is available in the [`docs/`](./docs/) directory.**

### 🚨 Implementing Other Modules?
**→ Start here: [docs/START_HERE.md](./docs/START_HERE.md)** ⭐

This is the ONLY guide you need - simple 4-step process!

### Additional Documentation (Optional)
- ⚡ [Module Quick Reference](./docs/MODULE_QUICK_REFERENCE.md) - Code snippets
- 📊 [Module Comparison Matrix](./docs/MODULE_COMPARISON_MATRIX.md) - Feature comparison
- 📖 [Module Implementation Standard](./docs/MODULE_IMPLEMENTATION_STANDARD.md) - Detailed patterns
- 🔄 [Module Migration Guide](./docs/MODULE_MIGRATION_GUIDE.md) - Migration steps

### Original Guides
- 🚀 [Implementation Guide](./docs/guides/implementation.md) - React Query + Zustand
- 📋 [Feature Analysis](./docs/analysis/feature-analysis.md) - Feature inventory (Updated Feb 9, 2026)
- ✅ [Phase 1 Complete](./docs/analysis/phase1-complete.md) - Migration progress (Updated Feb 9, 2026)

## Module Migration Progress

**Status:** ✅ 21/21 modules (100%) complete 🎉

### Completed Sections ✅
- **Sales** (7/7): Leads, Contacts, Accounts, Deals, Campaigns, Documents, Forecasts
- **Inventory** (7/7): Products, Vendors, Sales Orders, Quotes, Invoices, Purchase Orders, Price Books
- **Activities** (4/4): Tasks, Calls, Meetings, **Calendar View** ✨
- **Support** (2/2): Cases, Solutions
- **Services** (1/1): Services
- **Projects** (1/1): Projects

### Key Features Implemented ✅
- ✅ **Export Functionality** (CSV, Excel, PDF, Clipboard)
- ✅ **Advanced Filters** (15 operators, presets)
- ✅ **Bulk Operations** (delete, update, export)
- ✅ **Data Visualizations** (5 chart types with Recharts)
- ✅ **Kanban Board** (drag & drop for Deals module)
- ✅ **Calendar View** (Month/Week/Day/Agenda for Activities)
- ✅ **React Query + Zustand** (all 21 modules)
- ✅ **Performance Optimized** (~25% bundle reduction)

All completed modules follow the standardized React Query + Zustand architecture with full feature parity.

## Features

- 📊 **Dashboard** - Overview with real-time statistics and 5 interactive charts
- 👥 **Contact Management** - Comprehensive contact database with search, filters, and bulk operations
- 📈 **Lead Tracking** - Track and qualify leads through your sales funnel
- 💼 **Deal Pipeline** - Visual deal management with Kanban board and drag & drop
- 📅 **Calendar View** - Month/Week/Day/Agenda views for activities (Tasks, Calls, Meetings)
- 📤 **Export Functionality** - Export data to CSV, Excel, PDF, or clipboard
- 🔍 **Advanced Filters** - 15 operators with preset management
- ⚡ **Modern UI** - Beautiful, responsive interface with smooth animations
- 🎨 **Tailwind CSS** - Fully customizable design system with theme support
- 🔄 **Framer Motion** - Smooth, professional animations
- 📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Performance Optimized** - ~25% bundle reduction with lazy loading

## Tech Stack

### Core
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first CSS framework

### UI & Animations
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Production-ready animation library
- **Auto Animate** - Automatic animations for lists
- **Lucide React** - Beautiful icon set

### State & Data Management
- **React Query (TanStack Query) 5.40** - Server state management & data fetching
- **Zustand 4.5** - Client/UI state management
- **React Hook Form 7.51** - Performant form handling
- **Zod 3.23** - Schema validation

### Additional Libraries
- **date-fns 3.6** - Date manipulation
- **Sonner 1.5** - Toast notifications
- **Recharts 2.12** - Charts and analytics
- **React Big Calendar 1.11** - Calendar view for activities
- **@dnd-kit 6.3** - Drag and drop for Kanban board
- **xlsx 0.18** - Excel export
- **jspdf 4.1** - PDF export

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd c:\Users\sagarr\Projects\CRM
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
CRM/
├── app/                      # Next.js App Router
│   ├── (app)/                # Protected app routes
│   │   ├── activities/       # Activities module
│   │   │   ├── calendar/     # Calendar view ✨
│   │   │   ├── calls/        # Calls management
│   │   │   ├── meetings/     # Meetings management
│   │   │   └── tasks/        # Tasks management
│   │   ├── analytics/        # Analytics with charts
│   │   ├── dashboard/        # Dashboard home
│   │   ├── inventory/        # Inventory module (7 pages)
│   │   ├── projects/         # Projects module
│   │   ├── reports/          # Reports module
│   │   ├── sales/            # Sales module (7 pages)
│   │   │   └── deals/        # With Kanban view ✨
│   │   ├── services/         # Services module
│   │   ├── settings/         # Settings pages
│   │   ├── support/          # Support module (2 pages)
│   │   └── layout.tsx        # App layout with sidebar
│   ├── globals.css           # Global styles + theme
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── Calendar/             # Activity calendar ✨
│   ├── Charts/               # 5 chart components ✨
│   ├── KanbanBoard/          # Drag & drop Kanban ✨
│   ├── ExportButton/         # Export functionality
│   ├── AdvancedFilter/       # Advanced filtering
│   ├── BulkActionsToolbar/   # Bulk operations
│   ├── Forms/                # Form drawers (21 modules)
│   ├── DataTable/            # Data table component
│   ├── ui/                   # shadcn/ui components
│   └── providers.tsx         # React Query provider
├── lib/
│   ├── api/                  # API layer (mock + real)
│   │   └── mock/             # Mock APIs (21 modules)
│   ├── queries/              # React Query hooks (126 hooks)
│   ├── export/               # Export utilities
│   └── utils.ts              # Utility functions
├── stores/
│   └── useUIStore.ts         # Zustand UI state
├── hooks/
│   ├── useDebounce.ts        # Debouncing
│   └── useFilterPresets.ts   # Filter presets
├── types/
│   └── crm.ts                # TypeScript types
├── docs/                     # Documentation
├── public/                   # Static assets
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Dashboard
- Real-time statistics cards with toggle visibility
- 5 interactive charts (Recharts):
  - Sales Trend Chart (line chart)
  - Pipeline Chart (bar chart)
  - Lead Source Chart (pie chart)
  - Activity Chart (bar chart)
  - Revenue Comparison Chart
- Recent activities feed
- Quick action buttons
- Animated components
- Time range filters (7d/30d/90d)

### Sales Modules
- Searchable lists with advanced filters (15 operators)
- Filter by status, source, owner, tags
- Add/edit with comprehensive forms
- Detail views with full information
- Bulk operations (delete, update, export)
- Export to CSV, Excel, PDF, clipboard
- **Deals: Kanban board** with drag & drop between pipeline stages

### Activities
- Tasks, Calls, Meetings management
- **Calendar View** (Month/Week/Day/Agenda)
- Color-coded events by type
- Filter toggles by activity type
- Stats dashboard
- Click events to navigate to details
- Form drawers for quick creation

### Inventory
- Products, Vendors, Purchase Orders
- Sales Orders, Quotes, Invoices
- Price Books management
- All with advanced filters and bulk operations

### Support & Services
- Cases and Solutions tracking
- Services catalog
- Projects management
- Full CRUD operations

## Customization

### Colors
Edit `tailwind.config.ts` to customize the color scheme:

```typescript
theme: {
  extend: {
    colors: {
      primary: { ... },
      secondary: { ... },
      // Add your colors
    }
  }
}
```

### Components
All UI components are in `components/ui/` and can be modified directly.

## Next Steps

### Backend Integration (Recommended)

The frontend is 100% complete and ready for backend integration:

1. **Update API Layer**: Change `USE_MOCK = false` in `lib/api/[module].ts` files
2. **Implement Real APIs**: Create real API functions in `lib/api/real/` directory
3. **Configure Environment**: Update `.env.local` with API endpoints
4. **Authentication**: Implement JWT token handling
5. **Test Integration**: Verify all CRUD operations work with real backend

### Current Architecture

- **Mock API Layer**: All 21 modules use mock APIs with simulated delays
- **React Query**: Ready for real API integration
- **Zustand**: UI state management configured
- **Type Definitions**: Complete TypeScript types in `types/crm.ts`

See documentation in `docs/` for detailed implementation guides.

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js and TypeScript
