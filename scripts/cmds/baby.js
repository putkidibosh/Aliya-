const axios = require("axios");

const roniBotTriggers = [
  "baby", "bby", "babu", "bbu", "jan", "bot", "জান", "জানু", "বেবি", "wifey", "hinata", "king", "mrking"
];

const peacockTriggers = ["baby", "bby", "jan", "জান", "জানু", "বেবি"];
const spamCooldown = new Map();

const fallbackMessages = [
  "কথা কম কও, মুখে মাস্ক পইরা ঘোড়ো 😷🔥",
  "মাথাডা একদম আউলায়া দিলা তো ভাই 😵‍💫💭",
  "এমবি নাই ভাই, এমবি কিনে দে তারপর কথা কমু 📱💸",
  "পড়ালেখা বাদ দিয়া বটের লগে আলু ছুলতে আইছো? 🥔📚",
  "এক চ্যাপা মাইরা একবারে উগান্ডা পাঠায়া দিমু ✈️🐒",
  "চা খাইবা? না খাইলে ভাগো তো এখান থেকে ☕🧹",
  "তর কথা শুইন্যা আমার ফ্রিজের পানিও গরম হয়া গেছে 🧊🔥",
  "আমারে কি গুগল পাইছ নাকি? সব প্রশ্নের উত্তর পাইবা 🤖❌",
  "হুদাই চিল্লাইও না, একটু পপকন খাইয়া ঘুম দাও 🍿😴",
  "আরে ভাই থামো, এক্টু দম নিতে দাও আমারে 😮‍💨✋",
  "কি বললা বুঝি নাই, আরেকবার কও তো বুড়া দাদু 👵🏻👓",
  "বিকাশে ৫০০ টাকা পাঠাও, তারপর সুন্দর উত্তর দিমু 🤑💳",
  "তোমার কথা শুইন্যা আমার ব্যাটারি ১০% কম্যা গেল 🔋🪫",
  "আহা কী প্রেম! যেন শাহজাহান আর মমতাজের নাতনি 🕌❤️",
  "থামো তো ভাই! মাথায় হাত দিয়া একটু ভাবতে দাও 🤯🤔",
  "লুঙ্গি সামলায়া কথা কও, বাতাস ছাড়লে উইড়া যাইবা 🌬️🩲",
  "অতিরিক্ত ঢং স্বাস্থ্যের জন্য ক্ষতিকর baby 🍼😏",
  "ইসস! এতো ঢং করো কেন? একদম চড় খাইতে ইচ্ছে করতাছে 🤏🏻🐸"
];

const baseApiUrl = "https://baby-1-tf9x.onrender.com";

const adminCredentials = {
  username: "Mr.king",
  password: "tanindev@#9"
};

const makeBold = (text) => {
  if (!text) return "";
  const fonts = {
    a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺",
    n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
    A: "𝗔", B: "𝗕", C: "Ｃ", D: "Ｄ", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝", K: "Ｋ", L: "𝗟", M: "Ｍ",
    N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧", U: "𝗨", V: "𝘃", W: "𝗪", X: "𝘅", Y: "𝗬", Z: "𝗭",
    "0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵"
  };
  return text.split("").map(char => fonts[char] || char).join("");
};

const extractEmojis = (text) => {
  if (!text) return [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const segments = Array.from(segmenter.segment(text));
    const emojiRegex = /\p{Extended_Pictographic}/u;
    return segments.map(s => s.segment).filter(str => emojiRegex.test(str));
  }
  const fallbackRegex = /(\p{Extended_Pictographic}[\u{1F3FB}-\u{1F3FF}]?)/gu;
  return text.match(fallbackRegex) || [];
};

const checkSingleQuery = async (query) => {
  if (!query) return null;
  try {
    const res = await axios.post(`${baseApiUrl}/api/hinata`, { text: query, style: 3 });
    const replyMsg = res.data ? res.data.message : null;
    
    if (replyMsg && 
        !replyMsg.includes("sikai deu") && 
        !replyMsg.includes("error") && 
        !replyMsg.includes("fetching") && 
        !replyMsg.includes("I don't know")) {
      
      if (replyMsg.includes(" | ")) {
        const list = replyMsg.split(" | ");
        return list[Math.floor(Math.random() * list.length)];
      }
      return replyMsg;
    }
  } catch {
    return null;
  }
  return null;
};

const getRandomTeachResponse = async () => {
  try {
    const res = await axios.get(`${baseApiUrl}/api/jan/random-trigger`);
    if (res.data && res.data.trigger) {
      const resp = await checkSingleQuery(res.data.trigger);
      if (resp) return resp;
    }
  } catch {}
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
};

const handleMediaCheck = (attachments) => {
  if (attachments && attachments.length > 0) {
    const type = attachments[0].type;
    const replies = {
      video: ["Mb nai bby pore dio", "ajaira sop video😒", "1 ta kidni de then dekhmu"],
      audio: ["Sent 100000000tk to bkash then I will listen", "aj boyra bole kisu sunte parlam na😤", "tor Kun Kun jaygay betha go bandubi lolita"],
      photo: ["iss amk picture diye potanor chesta 🌚😘", "pic dekhe ki hobe jokon mb e nai"]
    };
    if (replies[type]) {
      const list = replies[type];
      return list[Math.floor(Math.random() * list.length)];
    }
  }
  return null;
};

const autoTeachAndGetResponse = async (triggerText) => {
  const randomResponse = await getRandomTeachResponse();
  if (triggerText && triggerText.length >= 2) {
    try {
      await axios.post(`${baseApiUrl}/api/jan/teach`, {
        trigger: triggerText,
        responses: randomResponse
      }, {
        headers: {
          username: adminCredentials.username,
          password: adminCredentials.password
        }
      });
    } catch (e) {}
  }
  return randomResponse;
};

const fetchApiResponse = async (text, attachments = []) => {
  try {
    const fullTextResp = await checkSingleQuery(text);
    if (fullTextResp) return fullTextResp;

    const emojis = extractEmojis(text);
    if (emojis.length > 0) {
      for (const singleEmoji of emojis) {
        const emojiResp = await checkSingleQuery(singleEmoji);
        if (emojiResp) return emojiResp;
      }
    }

    const words = text.trim().split(/\s+/);
    if (words.length > 1) {
      for (const word of words) {
        const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, "");
        if (cleanWord.length < 2) continue;
        
        const wordResp = await checkSingleQuery(cleanWord);
        if (wordResp) return wordResp;
      }
    }

    return await autoTeachAndGetResponse(text);
  } catch {
    return await autoTeachAndGetResponse(text);
  }
};

const getDatabaseStats = async () => {
  try {
    const res = await axios.get(`${baseApiUrl}/api/jan/stats`, {
      headers: {
        username: adminCredentials.username,
        password: adminCredentials.password
      },
      timeout: 5000
    });
    if (res.data && res.data.success) {
      const teachCount = res.data.totalTeach || 0;
      const responseCount = res.data.totalResponses || 0;
      const dataSize = res.data.dataSize || null;

      let msg = `🐤 | Total Teach = ${teachCount}\n♻️ | Total Response = ${responseCount}`;
      if (dataSize) {
        msg += `\n💾 | Database Size = ${dataSize}`;
      }
      return msg;
    } else {
      throw new Error("API response error");
    }
  } catch {
    return `🐤 | Total Teach = api off\n♻️ | Total Response = api off\nServer is having error...server ki maka vosra 👅💦`;
  }
};

module.exports.config = {
   name: "baby", 
   aliases: ["hinata", "bby", "bbu", "jan", "janu", "wifey", "bot"],
   version: "20.0",
   author: "Mr.King",
   role: 0,
   category: "chat",
   guide: {
     en: "{pn} [message]"
   }
};

module.exports.onStart = async ({ api, event, args }) => {
  if (event.senderID == api.getCurrentUserID()) return;
  
  const uid = event.senderID;
  const currentTime = Date.now();
  if (spamCooldown.has(uid) && currentTime - spamCooldown.get(uid) < 3000) {
      return api.sendMessage(makeBold("Hop bumb koros kn 😒"), event.threadID, event.messageID);
  }
  spamCooldown.set(uid, currentTime);

  try {
    if (args && args.length > 0) {
      const fullCmd = args.join(" ").toLowerCase();
      if (fullCmd === "list" || fullCmd === "datacheck") {
        const stats = await getDatabaseStats();
        return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
      }
    }

    const mediaReply = handleMediaCheck(event.attachments);
    if (mediaReply) {
      return api.sendMessage(makeBold(mediaReply), event.threadID, event.messageID);
    }

    if (!args || args.length === 0) {
      const ran = ["Bolo baby", "I love you", "Welcome to Mr.King Chatbot! 😎"];
      return api.sendMessage(makeBold(ran[Math.floor(Math.random() * ran.length)]), event.threadID, event.messageID);
    }

    const userMsg = args.join(" ");
    const botResponse = await fetchApiResponse(userMsg, event.attachments || []);
    
    api.sendMessage(makeBold(botResponse), event.threadID, (err, info) => {
      if (!err && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          triggerText: userMsg
        });
      }
    }, event.messageID);

  } catch (err) {
    console.error(err);
  }
};

module.exports.onReply = async ({ api, event, Reply }) => {
  if (event.senderID == api.getCurrentUserID()) return;

  const uid = event.senderID;
  const currentTime = Date.now();
  if (spamCooldown.has(uid) && currentTime - spamCooldown.get(uid) < 3000) {
      return api.sendMessage(makeBold("Hop spam koros kn 😒"), event.threadID, event.messageID);
  }
  spamCooldown.set(uid, currentTime);

  try {
    const userMsg = event.body || "";

    if (Reply && Reply.type === "reply" && userMsg.trim()) {
      const previousBotMsg = Reply.triggerText || "";
      if (previousBotMsg && previousBotMsg.length >= 2) {
        try {
          await axios.post(`${baseApiUrl}/api/jan/teach`, {
            trigger: previousBotMsg,
            responses: userMsg
          }, {
            headers: {
              username: adminCredentials.username,
              password: adminCredentials.password
            }
          });
        } catch (e) {}
      }
    }

    const mediaReply = handleMediaCheck(event.attachments);
    let botResponse = mediaReply;
    if (!botResponse) {
      botResponse = await fetchApiResponse(userMsg, event.attachments || []);
    }

    api.sendMessage(makeBold(botResponse), event.threadID, (err, info) => {
      if (!err && info) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          triggerText: userMsg
        });
      }
    }, event.messageID);
  } catch (err) {
    console.error(err);
  }
};

module.exports.onChat = async ({ api, event }) => {
  if (event.senderID == api.getCurrentUserID()) return;

  try {
    const message = event.body || "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage === "baby list" || lowerMessage === "baby datacheck") {
      const stats = await getDatabaseStats();
      return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
    }

    if (roniBotTriggers.some(word => lowerMessage.startsWith(word))) {
        const uid = event.senderID;
        const currentTime = Date.now();
        if (spamCooldown.has(uid) && currentTime - spamCooldown.get(uid) < 3000) {
            return api.sendMessage(makeBold("Hop bumb koros kn 😒"), event.threadID, event.messageID);
        }
        spamCooldown.set(uid, currentTime);

        const reactionEmoji = peacockTriggers.some(word => lowerMessage.startsWith(word)) ? "🪽" : "🪽";
        api.setMessageReaction(reactionEmoji, event.messageID, () => {}, true);

        let userText = message; 
        for (const prefix of roniBotTriggers) {
            if (lowerMessage.startsWith(prefix)) { 
                userText = message.substring(prefix.length).trim();
                break;
            }
        }

        if (userText.toLowerCase() === "list" || userText.toLowerCase() === "datacheck") {
          const stats = await getDatabaseStats();
          return api.sendMessage(makeBold(stats), event.threadID, event.messageID);
        }

        if (!userText) {
          const ranPrompt = [
            "Bolo baby, what do you want to say?",
            "Ummah daw rag kome jabe 😘",
            "Bolo baby, shunsi toh!",
            "Keno dakco baby? 😉",
            "𝗘𝘃𝗲𝗿𝘆𝘁𝗵𝗶𝗻𝗴 𝗶𝘀 𝘁𝗲𝗺𝗽𝗼𝗿𝗮𝗿𝘆, 𝗯𝘂𝘁 𝗠𝗿.𝗞𝗶𝗻𝗴'𝘀 𝗯𝗼𝘁 𝗶𝘀 𝗽𝗲𝗿𝗺𝗮𝗻𝗲𝗻𝘁! ✨♾️"
          ];
          const chosenText = ranPrompt[Math.floor(Math.random() * ranPrompt.length)];
          return api.sendMessage(makeBold(chosenText), event.threadID, (err, info) => {
            if (!err && info) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: module.exports.config.name,
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                triggerText: chosenText
              });
            }
          }, event.messageID);
        }

        const mediaReply = handleMediaCheck(event.attachments);
        if (mediaReply) {
          return api.sendMessage(makeBold(mediaReply), event.threadID, event.messageID);
        }

        const botResponse = await fetchApiResponse(userText, event.attachments || []);
        api.sendMessage(makeBold(botResponse), event.threadID, (err, info) => {
          if (!err && info) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: module.exports.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              triggerText: userText
            });
          }
        }, event.messageID);
    }
  } catch (err) {
    console.error(err);
  }
};
      
