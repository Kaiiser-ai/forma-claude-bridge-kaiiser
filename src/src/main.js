import { Forma } from "forma-embedded-view-sdk/auto";

// ============================================================
// FORMA CLAUDE BRIDGE - Extension
// ============================================================
// This extension reads data from Forma and exposes it for
// bridging to Claude via MCP. It demonstrates read operations
// on buildings, terrain, site limits, and analysis data.
// ============================================================

const outputEl = document.getElementById("output");
const statusEl = document.getElementById("status");

// --- Logging ---
function log(message, type = "info") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  outputEl.appendChild(entry);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function logData(label, data) {
  log(`${label}:`, "success");
  const entry = document.createElement("div");
  entry.className = "log-entry data";
  entry.textContent = JSON.stringify(data, null, 2);
  outputEl.appendChild(entry);
  outputEl.scrollTop = outputEl.scrollHeight;
}

// --- Initialize ---
async function init() {
  try {
    log("Initializing Forma SDK...");

    // Test connection by getting the root element
    const root = await Forma.elements.getByPath({ path: "root" });

    if (root) {
      statusEl.className = "status connected";
      statusEl.textContent = "✅ Connected to Forma SDK";
      log("Successfully connected to Forma!", "success");
      log(`Project root element loaded`, "success");

      // Auto-load summary
      await loadSummary();
    }
  } catch (error) {
    statusEl.className = "status disconnected";
    statusEl.textContent = "❌ Not connected - Open this extension inside Forma";
    log(`Connection failed: ${error.message}`, "error");
    log("Make sure this extension is loaded inside Forma's extension panel.", "info");
  }
}

// --- Load Summary Metrics ---
async function loadSummary() {
  try {
    const buildingPaths = await Forma.geometry.getPathsByCategory({
      category: "building",
    });

    document.getElementById("buildingCount").textContent = buildingPaths.length;
    document.getElementById("metricsGrid").style.display = "grid";

    log(`Found ${buildingPaths.length} buildings on site`, "success");
  } catch (error) {
    log(`Could not load summary: ${error.message}`, "error");
  }
}

// --- Get Buildings ---
window.getBuildings = async function () {
  try {
    log("Fetching buildings...");

    const buildingPaths = await Forma.geometry.getPathsByCategory({
      category: "building",
    });

    log(`Found ${buildingPaths.length} building(s)`, "success");

    for (let i = 0; i < buildingPaths.length; i++) {
      const path = buildingPaths[i];
      try {
        const { element } = await Forma.elements.getByPath({ path });
        logData(`Building ${i + 1} (${path})`, {
          path: path,
          properties: element.properties || {},
          children: element.children?.length || 0,
        });
      } catch (e) {
        log(`Could not read building at ${path}: ${e.message}`, "error");
      }
    }

    return buildingPaths;
  } catch (error) {
    log(`Error fetching buildings: ${error.message}`, "error");
  }
};

// --- Get Site Limits ---
window.getSiteLimits = async function () {
  try {
    log("Fetching site limits...");

    const sitePaths = await Forma.geometry.getPathsByCategory({
      category: "site_limit",
    });

    log(`Found ${sitePaths.length} site limit(s)`, "success");

    for (const path of sitePaths) {
      try {
        const footprint = await Forma.geometry.getFootprint({ path });
        if (footprint) {
          logData(`Site limit (${path})`, {
            path: path,
            coordinates: footprint.coordinates?.length || 0,
          });
        }
      } catch (e) {
        // Try getting triangles instead
        try {
          const triangles = await Forma.geometry.getTriangles({ path });
          logData(`Site limit triangles (${path})`, {
            path: path,
            triangleCount: triangles ? triangles.length / 9 : 0,
          });
        } catch (e2) {
          log(`Could not read site limit at ${path}: ${e2.message}`, "error");
        }
      }
    }
  } catch (error) {
    log(`Error fetching site limits: ${error.message}`, "error");
  }
};

// --- Get Area Metrics ---
window.getAreaMetrics = async function () {
  try {
    log("Fetching area metrics...");

    const buildingPaths = await Forma.geometry.getPathsByCategory({
      category: "building",
    });

    logData("Area Metrics Summary", {
      totalBuildings: buildingPaths.length,
      note: "Detailed area metrics available in Forma's analysis panel",
    });

    // Try to get element details for each building
    for (let i = 0; i < buildingPaths.length; i++) {
      const path = buildingPaths[i];
      try {
        const { element } = await Forma.elements.getByPath({ path });
        if (element.properties) {
          logData(`Building ${i + 1} properties`, element.properties);
        }
      } catch (e) {
        // Skip if can't read
      }
    }
  } catch (error) {
    log(`Error fetching area metrics: ${error.message}`, "error");
  }
};

// --- Get Terrain ---
window.getTerrain = async function () {
  try {
    log("Fetching terrain data...");

    const terrainPaths = await Forma.geometry.getPathsByCategory({
      category: "terrain",
    });

    log(`Found ${terrainPaths.length} terrain element(s)`, "success");

    for (const path of terrainPaths) {
      try {
        const triangles = await Forma.geometry.getTriangles({ path });
        logData(`Terrain (${path})`, {
          path: path,
          triangleCount: triangles ? triangles.length / 9 : 0,
          vertexCount: triangles ? triangles.length / 3 : 0,
        });
      } catch (e) {
        log(`Could not read terrain at ${path}: ${e.message}`, "error");
      }
    }
  } catch (error) {
    log(`Error fetching terrain: ${error.message}`, "error");
  }
};

// --- Get Current Selection ---
window.getSelection = async function () {
  try {
    log("Fetching current selection...");

    const selection = await Forma.selection.getSelection();

    if (selection && selection.length > 0) {
      log(`${selection.length} element(s) selected`, "success");

      for (const path of selection) {
        try {
          const { element } = await Forma.elements.getByPath({ path });
          logData(`Selected: ${path}`, {
            path: path,
            properties: element.properties || {},
            children: element.children?.length || 0,
          });
        } catch (e) {
          log(`Selected path: ${path}`, "info");
        }
      }
    } else {
      log("No elements currently selected. Click on something in Forma first.", "info");
    }
  } catch (error) {
    log(`Error fetching selection: ${error.message}`, "error");
  }
};

// --- Get All Elements ---
window.getAllElements = async function () {
  try {
    log("Fetching all element categories...");

    const categories = ["building", "terrain", "site_limit", "vegetation", "generic", "road"];
    const summary = {};

    for (const category of categories) {
      try {
        const paths = await Forma.geometry.getPathsByCategory({ category });
        summary[category] = paths.length;
        if (paths.length > 0) {
          log(`${category}: ${paths.length} element(s)`, "success");
        }
      } catch (e) {
        summary[category] = 0;
      }
    }

    logData("Element Summary", summary);
  } catch (error) {
    log(`Error fetching elements: ${error.message}`, "error");
  }
};

// --- Sun Analysis ---
window.runSunAnalysis = async function () {
  try {
    log("Triggering sun analysis... (this may take a moment)");

    const selection = await Forma.selection.getSelection();

    if (!selection || selection.length === 0) {
      log("Please select a building first, then run sun analysis.", "info");
      return;
    }

    log(`Running sun analysis on ${selection.length} selected element(s)...`, "info");

    // Note: Sun analysis API may have different signatures depending on SDK version
    try {
      const result = await Forma.analysis.triggerSun({
        paths: selection,
      });
      logData("Sun Analysis Result", result);
    } catch (e) {
      log(`Sun analysis API: ${e.message}`, "error");
      log("Sun analysis may need to be triggered from the Forma UI analysis panel.", "info");
    }
  } catch (error) {
    log(`Error running sun analysis: ${error.message}`, "error");
  }
};

// --- Wind Analysis ---
window.runWindAnalysis = async function () {
  try {
    log("Wind analysis needs to be triggered from Forma's analysis panel.", "info");
    log("The extension can read wind results once they're computed.", "info");
  } catch (error) {
    log(`Error: ${error.message}`, "error");
  }
};

// --- Custom Query Executor ---
window.executeQuery = async function () {
  const input = document.getElementById("queryInput").value.trim();
  if (!input) return;

  log(`Executing: ${input}`, "info");

  const parts = input.split(" ");
  const command = parts[0];
  const arg = parts.slice(1).join(" ");

  try {
    switch (command) {
      case "get_buildings":
        await window.getBuildings();
        break;

      case "get_site_limits":
        await window.getSiteLimits();
        break;

      case "get_terrain":
        await window.getTerrain();
        break;

      case "get_selection":
        await window.getSelection();
        break;

      case "get_all":
        await window.getAllElements();
        break;

      case "get_element":
        if (!arg) {
          log("Usage: get_element <path>  (e.g., get_element root)", "info");
          break;
        }
        const { element } = await Forma.elements.getByPath({ path: arg });
        logData(`Element: ${arg}`, element);
        break;

      case "get_paths":
        if (!arg) {
          log("Usage: get_paths <category>  (building, terrain, site_limit, vegetation, generic, road)", "info");
          break;
        }
        const paths = await Forma.geometry.getPathsByCategory({ category: arg });
        logData(`Paths for category: ${arg}`, paths);
        break;

      case "get_triangles":
        if (!arg) {
          log("Usage: get_triangles <path>", "info");
          break;
        }
        const triangles = await Forma.geometry.getTriangles({ path: arg });
        logData(`Triangles for: ${arg}`, {
          triangleCount: triangles ? triangles.length / 9 : 0,
          vertexCount: triangles ? triangles.length / 3 : 0,
        });
        break;

      case "help":
        log("Available commands:", "info");
        log("  get_buildings      - List all buildings", "info");
        log("  get_site_limits    - Get site boundaries", "info");
        log("  get_terrain        - Get terrain data", "info");
        log("  get_selection      - Get currently selected elements", "info");
        log("  get_all            - Summary of all categories", "info");
        log("  get_element <path> - Get element by path", "info");
        log("  get_paths <cat>    - Get paths by category", "info");
        log("  get_triangles <p>  - Get triangles for a path", "info");
        break;

      default:
        log(`Unknown command: ${command}. Type 'help' for available commands.`, "error");
    }
  } catch (error) {
    log(`Error: ${error.message}`, "error");
  }
};

// --- Start ---
init();
