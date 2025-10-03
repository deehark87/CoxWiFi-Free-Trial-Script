const puppeteer = require("puppeteer");
const sh = require("shelljs");
const random_name = require("node-random-name");
const random_useragent = require("random-useragent");
const fs = require("fs");
const path = require("path");
const argv = require("yargs")(process.argv.slice(2))
  .option("iface", {
    alias: "i",
    describe: "Interfaceto use",
    demandOption: true,
  })
  .option("debug", {
    alias: "d",
    type: "boolean",
    description: "Run with debug output",
  })
  .option("timeout", {
    alias: "t",
    default: 60000,
    description: "Time to wait for page loads",
  })
  .parse();

const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const domains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "live.com",
  "aol.com",
];

const emailMixer = (firstName, lastName) => {
  let first = rand(0, 1)
    ? firstName + "." + lastName
    : lastName + "." + firstName;

  return `${first}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

(async function run() {
  console.log("Starting wifi connection cycle...");
  const name = random_name();
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ")[1];

  const agent = random_useragent.getRandom(function (ua) {
    return !ua.userAgent.includes("Mobile") && ua.userAgent.includes("Windows");
  });

  const args = [
    "--user-agent=" + agent,
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
  ];

  const options = {
    args,
    headless: !argv.debug, // Run in headful mode when debugging
    ignoreHTTPSErrors: true,
  };

  sh.exec(
    // The sleep is important to allow the network interface to come back up fully.
    `bash ./Macchangerizer.sh ${argv.iface} && sleep 10`,
    async (code, output) => {
      var macParts = output.match(/(?<=New MAC:       \s*).*?(?=\s* )/gs);

      const mac = macParts[0];

      await new Promise((r) => setTimeout(r, argv.timeout));
      let browser;
      try {
        console.log("Launching browser...");
        browser = await puppeteer.launch(options);
        const page = await browser.newPage();

        // Optional: Load preload script if it exists and is needed.
        if (fs.existsSync("./preload.js")) {
          const preloadFile = fs.readFileSync("./preload.js", "utf8");
          await page.evaluateOnNewDocument(preloadFile);
        }

        const portalUrl = `https://uwp-wifi-access-portal.cox.com/splash?mac-address=${mac}&ap-mac=3C:82:C0:F6:DA:24&ssid=CoxWiFi&vlan=103&nas-id=NRFKWAGB01.at.at.cox.net&block=false&unique=$HASH`;

        console.log(`Navigating directly to captive portal: ${portalUrl}`);
        await page.goto(portalUrl, {
          waitUntil: "networkidle2",
          timeout: argv.timeout,
        });
        console.log("Landed on:", page.url());
        await page.screenshot({ path: path.resolve(__dirname) + "/landing.jpeg" });

        // --- Step 1: Find and click the 'Register' button ---
        const registerButtonXPath = "xpath///button[contains(., 'Register')]";
        console.log(`Looking for button with XPath: "${registerButtonXPath}"`);

        // Puppeteer will wait for the element to appear.
        await page.waitForSelector(registerButtonXPath, { timeout: argv.timeout });
        console.log("Found registration button. Clicking it...");
        await page.click(registerButtonXPath);

        console.log("Clicked registration button, waiting for navigation...");
        await page.waitForNavigation({ timeout: argv.timeout });

        console.log("Landed on registration page:", page.url());
        await page.screenshot({ path: path.resolve(__dirname) + "/registration-page.jpeg" });

        // --- Step 2: Fill out the registration form ---
        // Replace these selectors with the actual ones from the registration form.
        const firstNameSelector = "#firstName";
        const lastNameSelector = "#lastName";
        const ispDropdownSelector = "#isp";
        const emailSelector = "#email";
        const termsCheckboxSelector = "#terms-agree";
        const submitButtonSelector = "xpath///button[contains(., 'Submit')]";

        console.log("Filling out registration form...");
        await page.waitForSelector(firstNameSelector, { timeout: argv.timeout });

        await page.type(firstNameSelector, firstName, { delay: rand(100, 200) });
        await page.type(lastNameSelector, lastName, { delay: rand(100, 200) });

        console.log("Selecting internet provider...");
        await page.select(ispDropdownSelector, "Verizon");
        await page.type(emailSelector, emailMixer(firstName, lastName), { delay: rand(100, 200) });

        await page.click(termsCheckboxSelector);

        console.log("Submitting form...");
        await page.click(submitButtonSelector);

        await page.waitForNavigation({ timeout: argv.timeout });

        // --- Step 3: Verify success ---
        console.log("Landed on final page:", page.url());
        const pageText = await page.content();

        if (pageText.toLowerCase().includes("you are now connected")) {
          let t = new Date().toLocaleString();
          console.log("Wifi Connected Successfully at", t);
          await page.screenshot({ path: path.resolve(__dirname) + "/result-success.jpeg" });
        } else {
          console.log("Connection may have failed. Check 'result-error.jpeg'.");
          await page.screenshot({ path: path.resolve(__dirname) + "/result-error.jpeg" });
        }

      } catch (error) {
        console.error("An error occurred during the automation process:", error);
        if (argv.debug) {
          console.log("Debugging enabled. Pausing for 5 minutes. Check the browser window.");
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        }
      } finally {
        if (browser) {
          await browser.close();
          console.log("Browser closed.");
        }
      }

      const oneHour = 60 * 60 * 1000;
      console.log(`Scheduling next run in 60 minutes...`);
      setTimeout(run, oneHour);
    }
  );
})();
