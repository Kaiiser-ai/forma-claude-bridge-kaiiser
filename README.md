# Forma Claude Bridge Extension

A Forma embedded extension that reads project data (buildings, terrain, site limits, area metrics) from Forma's SDK, designed as the first step toward bridging Forma to Claude via MCP.

## Quick Setup

### 1. Install dependencies
```bash
cd forma-claude-extension
npm install
```

### 2. Start the dev server
```bash
npm run dev
```
This starts a local HTTPS server at `https://localhost:5173`

### 3. Load the extension in Forma
1. Open your project in Forma (app.autodeskforma.com or app.autodeskforma.eu)
2. Click the **Extensions** icon in the left sidebar (puzzle piece icon 🧩)
3. At the bottom, find **"Load local extension"** or **"Add extension"**
4. Enter the URL: `https://localhost:5173`
5. Your browser may warn about the self-signed certificate - click "Accept" / "Proceed"
6. The extension panel should appear in Forma's sidebar

### 4. Use the extension
- Click **Get Buildings** to list all buildings on site
- Click **Site Limits** to get site boundary data
- Click **Area Metrics** to read building properties
- Click **Get Selection** after selecting elements in Forma
- Use the **Custom Query** input for direct commands

### Available Custom Commands
```
get_buildings       - List all buildings
get_site_limits     - Get site boundaries
get_terrain         - Get terrain mesh data
get_selection       - Get currently selected elements
get_all             - Summary of all element categories
get_element <path>  - Get a specific element by path (e.g., get_element root)
get_paths <cat>     - Get paths by category (building, terrain, site_limit, vegetation, generic, road)
get_triangles <p>   - Get triangle mesh for a path
help                - Show all commands
```

## Architecture

```
┌─────────────────────────────────┐
│  Forma (Browser)                │
│  ┌───────────────────────────┐  │
│  │  This Extension           │  │
│  │  (forma-embedded-view-sdk)│  │
│  └──────────┬────────────────┘  │
└─────────────┼───────────────────┘
              │ (Next step: WebSocket/API bridge)
              ▼
┌─────────────────────────────────┐
│  Relay Server (n8n / Express)   │
│  Exposes MCP tools              │
└──────────┬──────────────────────┘
           │ MCP Protocol
           ▼
┌─────────────────────────────────┐
│  Claude Desktop / claude.ai     │
│  Calls MCP tools naturally      │
└─────────────────────────────────┘
```

## Next Steps
1. ✅ Read data from Forma (this extension)
2. 🔜 Add WebSocket relay to expose data to external server
3. 🔜 Build MCP server that Claude connects to
4. 🔜 Add write operations (create/modify elements)
