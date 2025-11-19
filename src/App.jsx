import { useEffect, useState } from "react";

const PALETTE_SIZE = 5;

function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}

function getContrastColor(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111827" : "#f9fafb";
}

function createInitialPalette() {
  return Array.from({ length: PALETTE_SIZE }, () => ({
    value: randomColor(),
    locked: false,
  }));
}

export default function App() {
  const [palette, setPalette] = useState(createInitialPalette);
  const [savedPalettes, setSavedPalettes] = useState([]);
  const [theme, setTheme] = useState("light");

  // load from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("palettes") || "[]");
      if (Array.isArray(saved)) setSavedPalettes(saved);
      const storedTheme = localStorage.getItem("palette-theme");
      if (storedTheme === "dark" || storedTheme === "light") {
        setTheme(storedTheme);
        document.documentElement.dataset.theme = storedTheme;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("palette-theme", theme);
  }, [theme]);

  const generatePalette = () => {
    setPalette((prev) =>
      prev.map((c) => (c.locked ? c : { ...c, value: randomColor() }))
    );
  };

  const toggleLock = (index) => {
    setPalette((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  const copyHex = async (hex) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      alert("Clipboard not available");
    }
  };

  const saveCurrentPalette = () => {
    const colors = palette.map((c) => c.value);
    const updated = [...savedPalettes, colors];
    setSavedPalettes(updated);
    localStorage.setItem("palettes", JSON.stringify(updated));
  };

  const clearSaved = () => {
    setSavedPalettes([]);
    localStorage.removeItem("palettes");
  };

  const exportJSON = () => {
    const data = {
      palette: palette.map((c) => c.value),
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const colors = palette.map((c) => c.value);
    const width = 1000;
    const height = 260;
    const stripeWidth = width / colors.length;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    colors.forEach((hex, index) => {
      ctx.fillStyle = hex;
      ctx.fillRect(index * stripeWidth, 0, stripeWidth, height);

      ctx.fillStyle = getContrastColor(hex);
      ctx.font = "20px system-ui, -apple-system, Segoe UI";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        hex.toUpperCase(),
        index * stripeWidth + stripeWidth / 2,
        height / 2
      );
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "palette.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">
          <span className="logo-mark" />
          <div className="logo-text">
            <span className="logo-title">Color Palette Studio</span>
            <span className="logo-subtitle">
              Generate, lock, export – fast & minimal.
            </span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-outline" onClick={toggleTheme}>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <a
            href="https://github.com/mysterekkk"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            @mysterekkk
          </a>
          <a
            href="https://luroweb.pl"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            LuroWeb.pl
          </a>
        </div>
      </header>

      <main className="layout">
        {/* PALETA */}
        <section className="panel">
          <div className="panel-header">
            <h1>Active palette</h1>
            <p>
              Press <strong>Generate</strong> to create a new palette. Lock
              colors you like so they stay when you randomize again.
            </p>
          </div>

          <div className="palette-row">
            {palette.map((c, i) => (
              <div
                key={i}
                className="color-card"
                style={{ background: c.value }}
              >
                <div
                  className="color-overlay"
                  style={{ color: getContrastColor(c.value) }}
                >
                  <span className="color-hex" onClick={() => copyHex(c.value)}>
                    {c.value.toUpperCase()}
                  </span>
                  <div className="color-actions">
                    <button
                      className="btn-chip"
                      onClick={() => copyHex(c.value)}
                    >
                      Copy
                    </button>
                    <button
                      className="btn-chip"
                      onClick={() => toggleLock(i)}
                    >
                      {c.locked ? "Unlock" : "Lock"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-actions">
            <button className="btn-primary" onClick={generatePalette}>
              Generate palette
            </button>
            <button className="btn-secondary" onClick={saveCurrentPalette}>
              Save palette
            </button>
            <button className="btn-secondary" onClick={exportPNG}>
              Export PNG
            </button>
            <button className="btn-secondary" onClick={exportJSON}>
              Export JSON
            </button>
          </div>
        </section>

        {/* ZAPISANE PALETY */}
        <aside className="panel side-panel">
          <div className="panel-header">
            <h2>Saved palettes</h2>
            <p>Stored in your browser (localStorage).</p>
          </div>

          {savedPalettes.length === 0 && (
            <p className="muted">No saved palettes yet.</p>
          )}

          <div className="saved-list">
            {savedPalettes.map((palette, index) => (
              <div key={index} className="saved-item">
                {palette.map((hex) => (
                  <div
                    key={hex + index}
                    className="saved-color"
                    style={{ background: hex }}
                    title={hex}
                  />
                ))}
              </div>
            ))}
          </div>

          {savedPalettes.length > 0 && (
            <button className="btn-outline full-width" onClick={clearSaved}>
              Clear saved
            </button>
          )}
        </aside>
      </main>

      <footer className="app-footer">
        <p>
          Open-source project by{" "}
          <a
            href="https://github.com/mysterekkk"
            target="_blank"
            rel="noreferrer"
          >
            @mysterekkk
          </a>{" "}
          · Realizacja:{" "}
          <a href="https://luroweb.pl" target="_blank" rel="noreferrer">
            LuroWeb.pl
          </a>
        </p>
      </footer>
    </div>
  );
}
