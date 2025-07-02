# creatio-sql-console
CRM Creatio SQL Console

# SQL Console for Creatio (Freedom UI 8.2 +)

A lightweight Angular 17 component that embeds an SQL editor and result viewer
directly into **Creatio Freedom UI**.  
It talks to a custom Creatio web-service (`iaQueryService`) and lets you run
ad-hoc SQL queries against the DB from inside the application.

| Feature | Description |
|---------|-------------|
| **Standalone build** | Bundles CodeMirror 6, Angular Material and all CSS — **no assets, no CDN**. |
| **SQL syntax highlighting** | Powered by CodeMirror `lang-sql`. |
| **Keyboard shortcuts** | `Ctrl / Cmd + Enter` — execute query. <br>`Ctrl / Cmd + X` — clear editor. |
| **Auto-formatted dates** | Strings like `/Date(1473068785000+0300)/` convert to `YYYY-MM-DD HH:MM:SS`. |
| **Paginated & scrollable table** | Independent scrollbars (X and Y); avoids stretching the page. |
| **Theming** | Colours, fonts and sizes inherit Creatio CSS variables. |

Usage
Open Studio ➜ SQL Console in the side-bar.

Type an SQL statement in the highlighted editor.

Press Execute or use Ctrl / Cmd + Enter.

Results show in a paginated table.
Large result-sets can be scrolled horizontally and vertically.

Clear the editor with Ctrl / Cmd + X.
