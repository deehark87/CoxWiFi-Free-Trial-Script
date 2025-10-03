# Copilot instructions for wifi2 project

Purpose
- Help AI coding agents make safe, useful edits to automate interactions with captive portals and MAC spoofing automation found in this repository.

Big picture (what this repo does)
- This is a small automation tool that spoofs a network interface MAC address and then uses Puppeteer to interact with a captive-portal landing page (`free-wifi.js`).
- Two main pieces: `Macchangerizer.sh` (shell script that calls `macchanger` and manages `network-manager`) and `free-wifi.js` (Node script that launches Puppeteer, loads a local `preload.js`, navigates to a Cox captive portal URL, fills forms, and captures screenshots).

Quick facts / commands
- Run the main script:
  - Requires Node.js and npm packages: puppeteer, shelljs, node-random-name, random-useragent, yargs
  - Example: node free-wifi.js --iface wlo1
- The `Macchangerizer.sh` script must be executable and may require sudo to run commands that stop/start network-manager and change interface state.
- The project expects a `preload.js` file in the repository root; it is read synchronously by `free-wifi.js` but is not present in this repository. Any edits must preserve the usage pattern: `fs.readFileSync('./preload.js','utf8')` and be compatible with evaluateOnNewDocument.

Project-specific patterns and conventions
- Synchronous file reads for small assets (e.g., `preload.js`) before launching Puppeteer. Keep changes that maintain this startup order.
- External shell integration: `free-wifi.js` calls `bash ./Macchangerizer.sh ${argv.iface} && sleep 10` via `shelljs.exec`. When modifying, maintain the expectation that the script outputs the new MAC address in a format matched by `/(?<=New MAC:       \s*).*?(?=\s* )/gs`.
- The code uses basic CSS selectors to locate fields on the captive portal. When updating selectors, prefer using the same page.waitForSelector + click/type + form submission flow.
- The script loops by calling `setTimeout(run, 60000 * 60)` to re-run once per hour. Preserve or consciously change this behavior.

Safety and environment notes (important for AI agents)
- This repository performs network and system-level operations (stopping network-manager, changing MAC addresses). Do not run these scripts on production machines or without user consent.
- `Macchangerizer.sh` assumes interface name is provided as the first arg and uses `ifconfig` and `service network-manager`. Some systems may use `ip` or `systemctl`; do not replace these without verifying environment.
- Puppeteer is launched with `--no-sandbox`; changes to these flags affect security and may require sandbox privileges.

Integration points and external dependencies
- Requires system packages: macchanger, network-manager (service), ifconfig (net-tools) or equivalent. Also requires sudo privileges for some operations.
- Node dependencies (package.json not present): puppeteer, shelljs, node-random-name, random-useragent, yargs. If adding or upgrading packages, add a `package.json` and pin versions.

Files to inspect when making changes
- `free-wifi.js` — main automation flow (Puppeteer + shell integration).
- `Macchangerizer.sh` — system-level MAC spoofing and network-manager control.
- `preload.js` — referenced but missing; any code that modifies browser environment should be placed here and be compatible with evaluateOnNewDocument.

Examples to copy/paste
- Preserve this MAC extraction regex when relying on current script output:
  - /(?<=New MAC:       \s*).*?(?=\s* )/gs
- Puppeteer navigation pattern to retain:
  - await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  - await page.waitForSelector(selector);
  - await page.type(selector, value, { delay: rand(100,300) });

If you update or add functionality
- Add or update a `package.json` if you change Node dependencies.
- If you change how MAC is reported by `Macchangerizer.sh`, update the regex in `free-wifi.js` accordingly.
- If you need to change `network-manager` commands for compatibility (systemd vs init), add a clear comment and detect environment before changing behavior.

What’s missing / TODOs for maintainers
- Add a minimal `package.json` with pinned deps so CI or developers can install packages reproducibly.
- Add `preload.js` or document expected contents and purpose.
- Add a README explaining required system packages and safety warnings.

If uncertain, ask the maintainer
- Which OS/distributions are targeted (Debian/Ubuntu/CentOS)?
- Where should `preload.js` come from and what must it contain?

Keep edits small and reversible
- Prefer adding flags and config over changing hardcoded values (e.g., add CLI options for timeouts, user agent overrides, sleep intervals).

End of file
