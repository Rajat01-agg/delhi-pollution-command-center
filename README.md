# Delhi Pollution Control Command Center

A real-time governance dashboard for monitoring and managing air quality across Delhi's wards. Built for the Delhi Pollution Control Committee (DPCC) to coordinate emergency response, track GRAP (Graded Response Action Plan) compliance, and communicate with citizens during air quality crises.

## 🌍 Overview

The **Delhi Pollution Command Center** is a comprehensive web-based platform enabling government officials to:
- **Monitor** real-time AQI across all Delhi wards with live heat maps
- **Issue Orders** and track GRAP compliance directives
- **Dispatch Resources** (water sprinklers, monitoring teams) with arrival time estimation
- **Coordinate** inter-departmental action during pollution emergencies
- **Communicate** emergency alerts across social media channels
- **Simulate** impact of interventions (odd-even traffic, construction bans, etc.)
- **Export** situation reports and briefings for leadership

## ✨ Key Features

### 📊 Real-Time Dashboard
- Live AQI monitoring by ward with color-coded pollution levels
- Interactive ward map powered by Leaflet
- Trend graphs showing AQI evolution over time
- Notifications for critical thresholds

### 🚨 Emergency Response
- **GRAP Compliance Widget**: Generate and print official Stage III/IV orders
- **Active Alerts**: High-priority incident tracking (fires, construction violations, smog events)
- **Resource Routing**: Calculate optimal routes for mobile monitors and response teams
- **Impact Tracker**: Measure real-time effectiveness of interventions

### 📢 Social Media Integration
- Pre-packaged alert templates for Twitter/WhatsApp
- AI-generated emergency infographics with official branding
- Multi-channel publish capability
- Engagement metrics tracking

### 🎯 Scenario Simulator
- "What-if" analysis tool for policy decisions
- Predictive modeling based on historical impact data
- Compare outcomes of different interventions
- Instant AQI impact visualization

### 📋 Administrative Tools
- Export daily situation reports (PDF)
- Dispatch and track response actions
- Manual alert posting for breaking news
- User role management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19.2 + TypeScript |
| **Build** | Vite 6.4 + Tailwind CSS |
| **Visualization** | Recharts, Leaflet, Lucide Icons |
| **Data** | Local JSON (ward_latest_aqi.json) |
| **Backend** | Python (ai_service.py), Node.js (worker.js) |
| **Styling** | Tailwind CSS (system fonts, no external stylesheet) |

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ (required)
- **npm** 7+ (or yarn/pnpm)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd delhi-pollution-command-center
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment** (optional)
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for production**
   ```bash
   npm run build
   npm run preview  # preview production build locally
   ```

## 📁 Project Structure

```
.
├── components/              # React components
│   ├── Header.tsx          # Top navbar with notifications
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── Dashboard.tsx       # Main AQI overview + ward map
│   ├── ActiveAlerts.tsx    # Incident management
│   ├── ActionsPanel.tsx    # Response action dispatch
│   ├── GRAPComplianceWidget.tsx  # Official order generation
│   ├── ImpactTracker.tsx   # Intervention effectiveness
│   ├── ScenarioSimulator.tsx # What-if analysis
│   ├── SocialMediaControl.tsx # Social media publishing
│   ├── WardMap.tsx         # Interactive Leaflet map
│   └── ExportBriefingButton.tsx # PDF briefing export
├── hooks/
│   └── useWardData.ts      # AQI data fetching & state
├── services/
│   └── airQualityApi.ts    # API integration layer
├── utils/
│   └── postHistory.ts      # Social media state management
├── public/
│   └── ward_latest_aqi.json # Live AQI data by ward
├── backend-core/           # Backend services
│   ├── ai_service.py       # AI/prediction engine
│   ├── worker.js           # Background job processor
│   └── firewall.js         # Security policies
├── App.tsx                 # Root component & routing
├── index.tsx               # Entry point
├── types.ts                # TypeScript type definitions
├── constants.tsx           # App-wide constants & colors
├── vite.config.ts          # Build configuration
└── package.json            # Dependencies
```

## 📜 Available Scripts

```bash
npm run dev       # Start development server (with hot reload)
npm run build     # Build optimized production bundle
npm run preview   # Preview production build locally
npm install       # Install dependencies
```

## 🎨 Design System

**Color Palette:**
- **Navy (#0f2942)**: Primary (sidebar, headers)
- **Orange (#f59e0b)**: Active state, urgency signals
- **White**: Clean backgrounds
- **Status Colors**: CPCB pollution standards (green→yellow→red→maroon)

**Typography:**
- System fonts only (faster load, no external requests)
- Responsive scaling: headings, body, captions
- Merriweather serif for formal documents

## 🔄 Data Flow

1. **AQI Source**: `public/ward_latest_aqi.json` (updated from OpenAQ + HT Labs)
2. **Hook**: `useWardData()` fetches & normalizes data
3. **State**: ViewState enum controls layout (Dashboard → Map → Alerts → etc.)
4. **Components**: Lazy-loaded via React.lazy() for performance

## 🔐 Environment Variables

Create `.env.local` to override defaults:
```env
# Optional: Backend service URLs
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8080

# Optional: Feature flags
VITE_ENABLE_SOCIAL_MEDIA=true
VITE_ENABLE_SIMULATOR=true
VITE_ENABLE_EXPORT=true
```

## ⚡ Performance Optimizations

- **Code Splitting**: Heavy components (Dashboard, WardMap) lazy-loaded
- **Memoization**: useWardData hook caches calculations
- **System Fonts**: No external font downloads
- **Gzip Compression**: Main bundle ~68KB gzipped
- **Image Optimization**: SVG emblems cached, responsive sizing

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, then reinstall |
| Port 5173 in use | Change with `npm run dev -- --port 3000` |
| Map not displaying | Check browser console; ensure Leaflet CSS is loaded |
| Broken images in navbar | Check `DPCC` badge fallback in Header.tsx (no external image dependency) |

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

Government of NCT of Delhi, Delhi Pollution Control Committee. All rights reserved.

## 👥 Team

Built during **H4D 26 (Hackathon for Democracy)** by the DPCC innovation team.

## 🔗 Links

- **DPCC Official**: [http://dpccdelhi.gov.in](http://dpccdelhi.gov.in)
- **Air Quality Index**: [http://aqi.cpcbccr.com](http://aqi.cpcbccr.com)
- **GRAP Guidelines**: Commission for Air Quality Management (CAQM)

---

**Last Updated:** April 2026  
**Status:** Active Development
