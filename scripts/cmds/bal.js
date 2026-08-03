const fs = require("fs");
const path = require("path");
const Canvas = require("canvas");

const makeBold = (text) => {
  if (!text) return "";
  const fonts = {
    a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤", l: "𝐥", m: "𝐦",
    n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌",
    N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
    "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
  };
  return text.split("").map(char => fonts[char] || char).join("");
};

module.exports = {
  config: {
    name: "bal",
    aliases: ["money", "balance", "cash", "balshow"],
    version: "3.0.4",
    author: "Mr.King 🎭",
    countDown: 5,
    role: 0,
    category: "economy",
    guide: { en: "{pn} or {pn} @tag" }
  },

  onStart: async function ({ api, event, usersData, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetID;
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (messageReply) {
      targetID = messageReply.senderID;
    } else {
      targetID = senderID;
    }

    try {
      const userData = await usersData.get(targetID);
      const money = userData.money || 0;
      const name = await usersData.getName(targetID) || "Facebook User";
      const formattedMoney = formatWorldEconomy(money);

      const W = 1000, H = 560;
      const canvas = Canvas.createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const primaryImage = "https://i.ibb.co/r2cWj5GL/image.png";
      const backupImage = "https://i.imgur.com/HeXGIcn.png"; 

      let bgImg;
      try {
        bgImg = await Canvas.loadImage(primaryImage);
      } catch (imgErr) {
        bgImg = await Canvas.loadImage(backupImage);
      }
      
      ctx.drawImage(bgImg, 0, 0, W, H);

      const CYAN = "#00F2FF";
      const PURPLE = "#BC13FE";

      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(0, 0, W, H);

      // ১. ইউজার নেম (স্ট্যান্ডার্ড বোল্ড ফন্ট যা সব হোস্টিংয়ে সাপোর্ট করবে)
      ctx.textAlign = "center";
      ctx.font = "bold 65px sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowBlur = 25;
      ctx.shadowColor = CYAN;
      ctx.fillText(name, W / 2, 130);

      // ২. ব্যালেন্স ডিসপ্লে
      ctx.font = "bold 105px sans-serif";
      ctx.shadowBlur = 35;
      ctx.shadowColor = PURPLE;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`$${formattedMoney}`, W / 2, 315);

      ctx.shadowBlur = 0; 
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(300, 355);
      ctx.lineTo(700, 355);
      ctx.stroke();

      // ৩. সাব-টেক্সট
      ctx.font = "bold 40px sans-serif";
      ctx.fillStyle = CYAN;
      ctx.shadowBlur = 10;
      ctx.shadowColor = CYAN;
      ctx.fillText(targetID === senderID ? "Your Wealth Status" : "User Wealth Status", W / 2, 425);

      // ৪. আপনার কাস্টম কোটেশন (হিজিবিজি বক্স টোটাল ফিক্সড)
      ctx.font = "bold 32px sans-serif"; 
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowBlur = 15;
      ctx.shadowColor = PURPLE;
      ctx.fillText("Loyalty is Royalty ~~ Everyone can't afford it", W / 2, 515);

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cachePath = path.join(cacheDir, `bal_${Date.now()}.png`);
      fs.writeFileSync(cachePath, canvas.toBuffer());

      return api.sendMessage({
        body: makeBold(`✨ Wealth status of ${name} fetched successfully!`),
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage(makeBold("❌ | Could not generate the balance card!"), threadID, messageID);
    }
  }
};

function formatWorldEconomy(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}
