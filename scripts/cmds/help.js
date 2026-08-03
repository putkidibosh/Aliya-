const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

function roleText(role) {
  if (role === 0) return "All Users";
  if (role === 1) return "Group Admins";
  if (role === 2) return "Bot Admin";
  return "Unknown";
}

function findCommand(name) {
  name = name.toLowerCase();
  for (const [, cmd] of commands) {
    const a = cmd.config?.aliases;
    if (cmd.config?.name === name) return cmd;
    if (Array.isArray(a) && a.includes(name)) return cmd;
    if (typeof a === "string" && a === name) return cmd;
  }
  return null;
}

async function renderHelpImage(categories, page, totalPages, totalCmds, prefix) {
  const width = 1200;
  const height = 1500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#080614");
  gradient.addColorStop(0.5, "#0d0a26");
  gradient.addColorStop(1, "#05030a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Header Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MISS QUEEN TERMINAL", width / 2, 110);

  ctx.fillStyle = "#a855f7";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("✿ Command Matrix ✿", width / 2, 155);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px sans-serif";
  ctx.fillText(`Page ${page}/${totalPages}  •  ${totalCmds} commands total`, width / 2, 195);

  // Divider Line
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 220);
  ctx.lineTo(width - 60, 220);
  ctx.stroke();

  // Columns Layout (3 Columns)
  const colWidth = 350;
  const startX = 65;
  const startY = 260;
  const colGap = 20;

  const catNames = Object.keys(categories);
  const itemsPerPage = 6; 
  const pageCats = catNames.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  pageCats.forEach((cat, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + col * (colWidth + colGap);
    const y = startY + row * 550;

    // Category Header
    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`⭔ ${cat}`, x, y);

    // Commands under category
    const cmds = categories[cat].slice(0, 14); 
    cmds.forEach((cmd, cIdx) => {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "20px sans-serif";
      ctx.fillText(` ✧ ${cmd}`, x + 10, y + 35 + cIdx * 34);
    });
  });

  // Footer Info
  ctx.strokeStyle = "#334155";
  ctx.beginPath();
  ctx.moveTo(60, height - 130);
  ctx.lineTo(width - 60, height - 130);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "22px sans-serif";
  ctx.fillText(` Reply with a number (1-${totalPages}) to jump to that page`, width / 2, height - 85);

  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(`✦ MAINTAINER — Mr.King ☠️✌🏼  •  Prefix: ${prefix} ✦`, width / 2, height - 45);

  const cachePath = path.join(__dirname, "cache", `help_${Date.now()}.png`);
  if (!fs.existsSync(path.dirname(cachePath))) fs.mkdirSync(path.dirname(cachePath), { recursive: true });

  fs.writeFileSync(cachePath, canvas.toBuffer());
  return cachePath;
}

function sendAutoDeleteMessage(api, message, content) {
  return message.reply(content, (err, info) => {
    if (!err && info && info.messageID) {
      setTimeout(() => {
        if (api.unsendMessage) api.unsendMessage(info.messageID);
      }, 20000);
    }
  });
}

module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    version: "3.1.0",
    author: "Mr.King",
    role: 0,
    category: "info",
    shortDescription: "Show all commands in terminal banner format",
    guide: "{pn} | {pn} <page_number> | {pn} <command>"
  },

  onStart: async function ({ api, message, args, event, role }) {
    // Dynamic Prefix Detection
    const prefix = getPrefix(event.threadID);
    const input = args.join(" ").trim();

    const categories = {};
    let totalCmds = 0;

    for (const [name, cmd] of commands) {
      if (!cmd?.config || cmd.config.role > role) continue;
      const cat = (cmd.config.category || "UNCATEGORIZED").toUpperCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
      totalCmds++;
    }

    const catNames = Object.keys(categories);
    const totalPages = Math.ceil(catNames.length / 6) || 1;

    /* ───── Command Details View (Style 12 - Superscript Soft) ───── */
    if (input && isNaN(input)) {
      const cmd = findCommand(input);
      if (!cmd) return sendAutoDeleteMessage(api, message, `❌ Command "${input}" not found!`);

      const c = cmd.config;
      const aliasText = Array.isArray(c.aliases) ? c.aliases.join(", ") : c.aliases || "None";
      
      let usage = c.guide?.en || c.guide || "No usage provided";
      if (typeof usage === "string") {
        usage = usage.replace(/{pn}/g, `${prefix}${c.name}`);
      }

      const infoMsg = 
`╭─── 『 COMMAND DETAILS 』 ───╮
│
├─ ᴺᵃᵐᵉ : ${c.name}
├─ ᶜᵃᵗᵉᵍᵒʳʸ : ${(c.category || "UNCATEGORIZED").toUpperCase()}
├─ ᴰᵉˢᶜʳⁱᵖᵗⁱᵒⁿ : ${c.shortDescription || "N/A"}
├─ ᴬˡⁱᵃˢᵉˢ : ${aliasText}
├─ ᵛᵉʳˢⁱᵒⁿ : ${c.version || "1.0"}
├─ ᴾᵉʳᵐⁱˢˢⁱᵒⁿ : ${roleText(c.role)}
├─ ᶜᵒᵒˡᵈᵒʷⁿ : ${c.countDown || 5}s
├─ ᴬᵘᵗʰᵒʳ : ${c.author || "Unknown"}
└─ ᵁˢᵃᵍᵉ : ${usage}

⏳ Auto deleting in 2 Minutes...
╰───────────────────────────╯`;

      return sendAutoDeleteMessage(api, message, infoMsg);
    }

    /* ───── Pagination Image View ───── */
    let page = parseInt(input) || 1;
    if (page < 1 || page > totalPages) page = 1;

    const imgPath = await renderHelpImage(categories, page, totalPages, totalCmds, prefix);

    return message.reply({
      attachment: fs.createReadStream(imgPath)
    }, (err, info) => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

      if (!err && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "help",
          messageID: info.messageID,
          author: event.senderID,
          totalPages: totalPages
        });

        setTimeout(() => {
          if (api.unsendMessage) api.unsendMessage(info.messageID);
        }, 20000);
      }
    });
  },

  onReply: async function ({ api, message, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const page = parseInt(event.body.trim());
    if (isNaN(page) || page < 1 || page > Reply.totalPages) return;

    const prefix = getPrefix(event.threadID);
    const categories = {};
    let totalCmds = 0;

    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      const cat = (cmd.config.category || "UNCATEGORIZED").toUpperCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
      totalCmds++;
    }

    const imgPath = await renderHelpImage(categories, page, Reply.totalPages, totalCmds, prefix);

    return message.reply({
      attachment: fs.createReadStream(imgPath)
    }, (err, info) => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (api.unsendMessage) api.unsendMessage(Reply.messageID);

      if (!err && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "help",
          messageID: info.messageID,
          author: event.senderID,
          totalPages: Reply.totalPages
        });

        setTimeout(() => {
          if (api.unsendMessage) api.unsendMessage(info.messageID);
        }, 20000);
      }
    });
  }
};
