const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const cooldown = new Map();

/* ───────── VIP PRICE TABLE ───────── */
const VIP_PRICES = {
  1: 25_000_000,
  2: 50_000_000,
  3: 75_000_000,
  4: 100_000_000,
  5: 125_000_000,
  6: 150_000_000,
  7: 175_000_000,
  8: 200_000_000,
  9: 225_000_000,
  10: 250_000_000,
  11: 275_000_000,
  12: 300_000_000,
  13: 325_000_000,
  14: 350_000_000,
  15: 375_000_000,
  16: 400_000_000,
  17: 425_000_000,
  18: 450_000_000,
  19: 475_000_000,
  20: 500_000_000,
  21: 525_000_000,
  22: 550_000_000,
  23: 575_000_000,
  24: 600_000_000,
  25: 625_000_000,
  26: 650_000_000,
  27: 675_000_000,
  28: 700_000_000,
  29: 725_000_000,
  30: 750_000_000,
  31: 800_000_000,
  60: 1_500_000_000,
  90: 2_250_000_000,
  120: 3_000_000_000,
  150: 3_750_000_000,
  180: 4_500_000_000,
  210: 5_250_000_000
};

// Base price per day for custom durations
const BASE_PRICE_PER_DAY = 25_000_000;

// Helper to convert standard numbers/text to Serif Bold style
const boldText = (text) => {
  const fonts = {
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
  };
  return text.split('').map(char => fonts[char] || char).join('');
};

const formatDate = ts => {
  const d = new Date(ts);
  const dateStr = `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
  return boldText(dateStr);
};

const formatMoney = n => {
  if (n >= 1e9) return `${boldText((n/1e9).toFixed(n%1e9?1:0))}𝐁`;
  if (n >= 1e6) return `${boldText((n/1e6).toFixed(n%1e6?1:0))}𝐌`;
  if (n >= 1e3) return `${boldText((n/1e3).toFixed(n%1e3?1:0))}𝐊`;
  return boldText(String(n));
};

// Calculate price for any number of days
const calculatePrice = (days) => {
  // If exact price exists in table, use it
  if (VIP_PRICES[days]) return VIP_PRICES[days];
  
  // Otherwise calculate based on base price per day
  return days * BASE_PRICE_PER_DAY;
};

// Calculate time remaining in "X days, Y hours" format
const getTimeRemaining = (expiryTimestamp) => {
  const now = Date.now();
  const diff = expiryTimestamp - now;
  if (diff <= 0) return "𝐄𝐱𝐩𝐢𝐫𝐞𝐝";
  
  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  
  if (days === 0) {
    return `${boldText(hours.toString())} 𝐡𝐨𝐮𝐫𝐬`;
  }
  
  return `${boldText(days.toString())} 𝐝𝐚𝐲𝐬, ${boldText(hours.toString())} 𝐡𝐨𝐮𝐫𝐬`;
};

module.exports = {
  config: {
    name: "vip",
    version: "2.3",
    author: "Arafat",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Premium VIP system" },
    longDescription: { en: "Buy VIP, admin add/remove, auto-expire, extend time" },
    category: "economy",
    guide: {
      en: "{p}vip\n" +
          "{p}vip list\n" +
          "{p}vip my\n" +
          "{p}vip buy <days>\n" +
          "{p}vip add <days> (reply/mention)\n" +
          "{p}vip remove (reply/mention)\n" +
          "{p}vip extend <days> (reply/mention)"
    }
  },

  onStart: async function ({ api, event, args, usersData, message, role }) {
    const uid = event.senderID;

    const now = Date.now();
    if (cooldown.get(uid) && now - cooldown.get(uid) < 3000)
      return message.reply("• ⏳ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭 𝟑 𝐬𝐞𝐜𝐨𝐧𝐝𝐬.");
    cooldown.set(uid, now);

    const allUsers = await usersData.getAll();
    for (const u of allUsers) {
      if (u.data?.vip?.expires && u.data.vip.expires <= Date.now()) {
        await usersData.set(u.userID, {
          data: { ...u.data, vip: null } 
        });
      }
    }

    /* ───────── VIP MY (CHECK OWN VIP STATUS) ───────── */
    if (args[0] === "my") {
      const user = await usersData.get(uid);
      const vipData = user.data?.vip;
      
      if (!vipData || !vipData.expires || vipData.expires <= Date.now()) {
        return message.reply(
          "• ❌ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐚𝐧 𝐚𝐜𝐭𝐢𝐯𝐞 𝐕𝐈𝐏 𝐬𝐮𝐛𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧.\n\n" +
          "📌 𝐔𝐬𝐞: {𝐩}𝐯𝐢𝐩 𝐛𝐮𝐲 <𝐝𝐚𝐲𝐬> 𝐭𝐨 𝐩𝐮𝐫𝐜𝐡𝐚𝐬𝐞 𝐕𝐈𝐏"
        );
      }

      const timeLeft = getTimeRemaining(vipData.expires);
      const userName = await usersData.getName(uid);
      
      return message.reply(
        `👑 | 𝐘𝐨𝐮𝐫 𝐕𝐈𝐏 𝐒𝐭𝐚𝐭𝐮𝐬\n\n` +
        `╭‣ 𝐍𝐚𝐦𝐞: ${boldText(userName)}\n` +
        `╭‣ 𝐒𝐭𝐚𝐭𝐮𝐬: ✅ 𝐀𝐜𝐭𝐢𝐯𝐞\n` +
        `╭‣ 𝐄𝐱𝐩𝐢𝐫𝐞𝐬: ${formatDate(vipData.expires)}\n` +
        `╰‣ 𝐓𝐢𝐦𝐞 𝐋𝐞𝐟𝐭: ${timeLeft}`
      );
    }

    /* ───────── VIP LIST (UPDATED STYLE) ───────── */
    if (args[0] === "list") {
      let out = "👑 | 𝐋𝐢𝐬𝐭 𝐨𝐟 𝐕𝐈𝐏 𝐔𝐬𝐞𝐫𝐬:\n\n";
      let count = 0;
      const freshUsers = await usersData.getAll();

      for (const u of freshUsers) {
        if (u.data?.vip?.expires && u.data.vip.expires > Date.now()) {
          const timeLeft = getTimeRemaining(u.data.vip.expires);
          out += `╭‣ ${boldText(u.name || "User")}\n╭‣ 𝐄𝐱𝐩𝐢𝐫𝐞𝐬: ${formatDate(u.data.vip.expires)}\n╰‣ 𝐓𝐢𝐦𝐞 𝐋𝐞𝐟𝐭: ${timeLeft}\n\n`;
          count++;
        }
      }

      if (!count) return message.reply("• ⚠️ 𝐍𝐨 𝐚𝐜𝐭𝐢𝐯𝐞 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝.");
      return message.reply(out);
    }

    const getTargetID = () => {
      if (event.messageReply) return event.messageReply.senderID;
      if (Object.keys(event.mentions).length > 0) return Object.keys(event.mentions)[0];
      return null;
    };

    const isAdmin = role >= 2; 

    if (args[0] === "add") {
      if (!isAdmin) return message.reply("• ❌ 𝐎𝐧𝐥𝐲 𝐦𝐲 𝐚𝐝𝐦𝐢𝐧 𝐀𝐫𝐚𝐟𝐚𝐭 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝!.");
      const days = parseInt(args[1]);
      if (!days || isNaN(days) || days <= 0) return message.reply("• ❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐯𝐚𝐥𝐢𝐝 𝐝𝐚𝐲𝐬.");

      const tid = getTargetID();
      if (!tid) return message.reply("• ❌ 𝐑𝐞𝐩𝐥𝐲 𝐨𝐫 𝐦𝐞𝐧𝐭𝐢𝐨𝐧 𝐚 𝐮𝐬𝐞𝐫.");

      const user = await usersData.get(tid);
      const currentData = user.data || {};
      const currentExpire = currentData.vip?.expires || Date.now();
      const startTime = Math.max(currentExpire, Date.now());
      const expires = startTime + (days * DAY);

      await usersData.set(tid, { data: { ...currentData, vip: { expires } } });
      const name = await usersData.getName(tid);
      return message.reply(
        `👑 𝐕𝐈𝐏 𝐀𝐝𝐝𝐞𝐝 𝐟𝐨𝐫 ${boldText(name)}\n` +
        `⏳ 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧: ${boldText(days.toString())} 𝐝𝐚𝐲𝐬\n` +
        `📅 𝐄𝐱𝐩𝐢𝐫𝐞𝐬: ${formatDate(expires)}`
      );
    }

    if (args[0] === "remove") {
      if (!isAdmin) return message.reply("• ❌ 𝐎𝐧𝐥𝐲 𝐦𝐲 𝐚𝐝𝐦𝐢𝐧 𝐀𝐫𝐚𝐟𝐚𝐭 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝!");
      const tid = getTargetID();
      if (!tid) return message.reply("• ❌ 𝐑𝐞𝐩𝐥𝐲 𝐨𝐫 𝐦𝐞𝐧𝐭𝐢𝐨𝐧 𝐚 𝐮𝐬𝐞𝐫.");
      const user = await usersData.get(tid);
      await usersData.set(tid, { data: { ...user.data, vip: null } });
      return message.reply("✅ 𝐕𝐈𝐏 𝐫𝐞𝐦𝐨𝐯𝐞𝐝 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲.");
    }

    if (args[0] === "buy") {
      const days = parseInt(args[1]);
      if (!days || isNaN(days) || days <= 0) {
        return message.reply(
          "• ❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐝𝐮𝐫𝐚𝐭𝐢𝐨𝐧\n\n" +
          "📌 𝐔𝐬𝐞: {𝐩}𝐯𝐢𝐩 𝐛𝐮𝐲 <𝐝𝐚𝐲𝐬>\n" +
          "📌 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: {𝐩}𝐯𝐢𝐩 𝐛𝐮𝐲 𝟏𝟓\n" +
          "💡 𝐘𝐨𝐮 𝐜𝐚𝐧 𝐛𝐮𝐲 𝐚𝐧𝐲 𝐧𝐮𝐦𝐛𝐞𝐫 𝐨𝐟 𝐝𝐚𝐲𝐬!"
        );
      }

      const price = calculatePrice(days);
      const user = await usersData.get(uid);
      const wallet = user.money || 0;

      if (wallet < price) {
        return message.reply(
          `• ❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐁𝐚𝐥𝐚𝐧𝐜𝐞!\n\n` +
          `╭‣ 𝐏𝐫𝐢𝐜𝐞: ${formatMoney(price)}\n` +
          `╭‣ 𝐘𝐨𝐮𝐫 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(wallet)}\n` +
          `╰‣ 𝐍𝐞𝐞𝐝𝐞𝐝: ${formatMoney(price - wallet)}`
        );
      }

      await usersData.set(uid, { money: wallet - price });
      const currentData = user.data || {};
      const currentExpire = currentData.vip?.expires || Date.now();
      const startTime = Math.max(currentExpire, Date.now());
      const expires = startTime + (days * DAY);

      await usersData.set(uid, { data: { ...currentData, vip: { expires } } });

      return message.reply(
        `👑 𝐕𝐈𝐏 𝐀𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝!\n\n` +
        `⏳ 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧: ${boldText(days.toString())} 𝐝𝐚𝐲𝐬\n` +
        `💰 𝐏𝐚𝐢𝐝: ${formatMoney(price)}\n` +
        `💳 𝐑𝐞𝐦𝐚𝐢𝐧𝐢𝐧𝐠: ${formatMoney(wallet - price)}\n` +
        `📅 𝐄𝐱𝐩𝐢𝐫𝐞𝐬: ${formatDate(expires)}`
      );
    }

    /* ───────── PRICE LIST (UPDATED STYLE) ───────── */
    return message.reply(
`👑 | 𝐕𝐈𝐏 𝐏𝐫𝐢𝐜𝐞 𝐋𝐢𝐬𝐭

╭‣ 𝟏 𝐃𝐚𝐲  → 𝟐𝟓𝐌
╭‣ 𝟐 𝐃𝐚𝐲𝐬 → 𝟓𝟎𝐌
╭‣ 𝟑 𝐃𝐚𝐲𝐬 → 𝟕𝟓𝐌
╭‣ 𝟒 𝐃𝐚𝐲𝐬 → 𝟏𝟎𝟎𝐌
╭‣ 𝟓 𝐃𝐚𝐲𝐬 → 𝟏𝟐𝟓𝐌
╭‣ 𝟔 𝐃𝐚𝐲𝐬 → 𝟏𝟓𝟎𝐌
╭‣ 𝟕 𝐃𝐚𝐲𝐬 → 𝟏𝟕𝟓𝐌
╭‣ 𝟏𝟓 𝐃𝐚𝐲𝐬 → 𝟑𝟕𝟓𝐌
╰‣ 𝟑𝟎 𝐃𝐚𝐲𝐬 → 𝟕𝟓𝟎𝐌

📌 𝐔𝐬𝐞: {𝐩}𝐯𝐢𝐩 𝐛𝐮𝐲 <𝐝𝐚𝐲𝐬>
📌 𝐂𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐕𝐈𝐏: {𝐩}𝐯𝐢𝐩 𝐦𝐲`
    );
  }
};