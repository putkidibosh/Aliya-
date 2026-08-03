/**
 * @author NTKhang
 * Official source: https://github.com/ntkhang03/Goat-Bot-V2
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const log = require("./logger/log.js");

const botFile = path.join(__dirname, "Aliya.js");
const port = String(process.env.PORT || 3210);

function startProject() {
    if (!fs.existsSync(botFile)) {
        log.err(
            "INDEX",
            "Aliya.js পাওয়া যায়নি। index.js এবং Aliya.js একই folder-এ রাখুন।"
        );
        process.exit(1);
    }

    log.info("INDEX", `Aliya Bot starting on port ${port}...`);

    const child = spawn(process.execPath, [botFile], {
        cwd: __dirname,
        stdio: "inherit",
        shell: false,
        env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV || "production",
            PORT: port
        }
    });

    child.on("error", (error) => {
        log.err("INDEX", "Aliya.js start করা যায়নি", error);
    });

    child.on("close", (code, signal) => {
        if (code === 2) {
            log.info("INDEX", "Aliya Bot restart হচ্ছে...");

            setTimeout(() => {
                startProject();
            }, 1000);

            return;
        }

        if (signal) {
            log.err("INDEX", `Bot বন্ধ হয়েছে। Signal: ${signal}`);
            return;
        }

        if (code !== 0) {
            log.err("INDEX", `Aliya.js বন্ধ হয়েছে। Exit code: ${code}`);
        }
    });
}

startProject();
