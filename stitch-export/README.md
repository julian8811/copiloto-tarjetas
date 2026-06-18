# Stitch Design Export — Copiloto IA

Proyecto Stitch: https://stitch.withgoogle.com/projects/2255941894502327613

## Pantallas exportadas

| Pantalla | Archivo | Descripción |
|----------|---------|-------------|
| Dashboard Financiero | `screens/dashboard-financiero.html` | Overview, KPIs, bento grid, gráficas |
| Gestión de Tarjetas | `screens/gesti-n-de-tarjetas.html` | Cards grid, utilización, pagos |
| Registrar Gastos | `screens/registrar-gastos.html` | Importación y registro manual |
| Copiloto IA - Chat | `screens/copiloto-ia-chat.html` | Interfaz de chat con IA |
| Logo Copiloto IA | (screenshot en manifest) | Asset de marca |

## Design tokens (Stitch)

- **Background:** `#0b141d` / `#020810`
- **Primary accent:** `#00e0b7` / `#00ffd1`
- **Text primary:** `#F0F4FC`
- **Text secondary:** `#8A99AF`
- **Surface card:** `#0B121E`
- **Outline:** `#3a4a44`
- **Fonts:** Plus Jakarta Sans, Space Mono
- **Icons:** Material Symbols Outlined

## Ver prototipos localmente

Abre cualquier archivo `.html` en el navegador, o sirve la carpeta:

```bash
npx serve stitch-export/screens
```

## MCP (Cursor)

```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR_STITCH_API_KEY"
      }
    }
  }
}
```

Obtén tu API key en: https://stitch.withgoogle.com/settings
