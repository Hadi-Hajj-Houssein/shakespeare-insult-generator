require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// ── INSULT DATA ───────────────────────────────────────────────
// 3 columns of Shakespearean insult words
// Final insult = "Thou [col1] [col2] [col3]!"

const col1 = [
  "artless", "bawdy", "beslubbering", "bootless", "burly-boned",
  "churlish", "clapper-clawed", "clay-brained", "common-kissing",
  "crook-pated", "dismal-dreaming", "dissembling", "dizzy-eyed",
  "doghearted", "dread-bolted", "earth-vexing", "elf-skinned",
  "fat-kidneyed", "fawning", "fobbing", "froward", "frothy",
  "gleeking", "goatish", "gorbellied", "impertinent", "infectious",
  "jarring", "loggerheaded", "lumpish", "mammering", "mangled",
  "mewling", "milk-livered", "motley-minded", "odiferous", "paunchy",
  "pribbling", "puking", "puny", "qualling", "rank", "reeky",
  "roguish", "ruttish", "saucy", "spleeny", "spongy", "surly",
  "tottering", "unmuzzled", "vain", "venomed", "villainous",
  "warped", "wayward", "weedy", "yeasty", "zany", "toad-spotted",
  "hasty-witted", "hedge-born", "idle-headed", "ill-breeding",
  "knotty-pated", "leaky", "lily-livered", "mad-bred", "onion-eyed",
  "rough-hewn", "shag-eared", "slack-jawed", "swag-bellied",
  "tardy-gaited", "unkempt", "unwashed", "vacant", "wart-necked",
  "beetle-headed", "boil-brained", "clouted", "craven", "dankish",
  "droning", "errant", "foul", "gaping", "grizzled", "half-faced",
  "impious", "jolthead", "knavish", "lewdly", "misbegotten",
  "naughty", "obscene", "peevish", "queasy", "rampallian", "scurvy",
];

const col2 = [
  "base-court", "bat-fowling", "beef-witted", "beetle-headed",
  "boil-brained", "clapper-clawed", "clay-brained", "common-kissing",
  "crook-pated", "dread-bolted", "earth-vexing", "elf-skinned",
  "fat-kidneyed", "fen-sucked", "flap-mouthed", "fly-bitten",
  "folly-fallen", "fool-born", "full-gorged", "guts-griping",
  "half-faced", "hasty-witted", "hedge-born", "hell-hated",
  "idle-headed", "ill-breeding", "ill-composed", "ill-nurtured",
  "imp-faced", "knotty-pated", "lean-witted", "logger-headed",
  "low-spirited", "mad-bred", "milk-livered", "motley-minded",
  "muddy-mettled", "onion-eyed", "pigeon-livered", "plume-plucked",
  "pottle-deep", "pox-marked", "raw-boned", "reeling-ripe",
  "rough-hewn", "rude-growing", "rump-fed", "shard-borne",
  "sheep-biting", "spur-galled", "swag-bellied", "tardy-gaited",
  "tickle-brained", "toad-spotted", "unchin-snouted", "unwashed",
  "venom-mouthed", "weather-bitten", "whoreson", "yeasty",
  "dizzy-eyed", "doghearted", "dissembling", "cloven-footed",
  "beef-headed", "canker-blossomed", "dewberry", "flibbertigibbet",
  "giglet", "haggard", "joithead", "lewdster", "measle",
  "noddy", "out-faced", "pignut", "quatch", "ratsbane",
  "scut", "strumpet-faced", "tallow-catch", "underling",
  "varlet", "wagtail", "whipster", "worm-eaten", "wrathful",
  "zenith-fallen", "addle-headed", "blundering", "craven-hearted",
  "defective", "empty-headed", "feckless", "gormless", "hapless",
  "ignoble", "jabbering", "knobby", "listless", "mindless",
];

const col3 = [
  "apple-john", "baggage", "barnacle", "bladder", "boar-pig",
  "bugbear", "bum-bailey", "canker-blossom", "clack-dish",
  "clotpole", "coxcomb", "codpiece", "death-token", "dewberry",
  "flap-dragon", "flax-wench", "flirt-gill", "foot-licker",
  "fustilarian", "giglet", "gudgeon", "haggard", "harpy",
  "hedge-pig", "horn-beast", "hugger-mugger", "joithead",
  "lewdster", "lout", "maggot-pie", "malt-worm", "mammet",
  "measle", "minnow", "miscreant", "moldwarp", "mumble-news",
  "nut-hook", "pigeon-egg", "pignut", "puttock", "pumpion",
  "ratsbane", "scut", "skainsmate", "strumpet", "toad",
  "varlot", "vassal", "wagtail", "whey-face", "worm",
  "apple-squire", "article", "bagpipe", "barnacle-goose",
  "blatherskite", "bogtrotted", "braggart", "bumpkin",
  "clodhopper", "clown", "dolt", "dullard", "dunce",
  "fathead", "fool", "fumbler", "gawk", "goof",
  "halfwit", "idiot", "ignoramus", "imbecile", "jackass",
  "knave", "lout", "lubber", "lummox", "nincompoop",
  "ninny", "nitwit", "noddy", "numbskull", "oaf",
  "simpleton", "slouch", "sot", "thickhead", "turnip",
  "underling", "villain", "wastrel", "witling", "wretch",
  "zimmer", "addlepate", "blunderbuss", "clodpoll", "doddypoll",
  "flibbertigibbet", "gobemouche", "hoddy-doddy", "jobbernowl",
  "looby", "mome", "ninnyhammer", "oinker", "popinjay",
];

// ── Openers and closers for variety ──────────────────────────
const openers = [
  "Thou", "Methinks thou art a", "Hark, thou",
  "Forsooth, thou", "By the stars, thou", "Prithee,",
  "Good morrow to thee,", "Hearken well,", "Zounds, thou",
];

const middles = [
  "art naught but a", "dost resemble a", "art verily a",
  "art nothing more than a", "wouldst shame a", "art truly a",
  "art as welcome as a", "dost smell of a", "art the very image of a",
];

const closers = [
  "Begone from my sight!",
  "May the fleas of a thousand dogs inhabit thy armpits!",
  "Thou art not worth the dust which the rude wind blows in thy face!",
  "I do desire we may be better strangers!",
  "Thou art a boil, a plague sore!",
  "Hence, and bestow thine odious company elsewhere!",
  "Out of my sight, thou dost infect mine eyes!",
  "Thou art the very model of a scoundrel most vile!",
  "Would thou wert clean enough to spit upon!",
  "Thou art not worth another word, else I'd call thee worse!",
  "A pox upon thy wretched existence!",
  "Fie upon thee, thou art an abomination of nature!",
  "May thy chamber pot forever runneth over!",
  "Thou art the reason wherefore fools exist!",
  "Get thee to a nunnery, thou insufferable wretch!",
];

// ── Topic-based special insults ───────────────────────────────
const topicInsults = {
  homework: [
    "Thou artless, ink-stained tormentor! Thou dost drain the very life from mine quill and leave my soul as empty as a miser's heart!",
    "Forsooth, thou pile of parchment misery! Thou art the bane of every student's evening, sent by the devil himself to rob us of our slumber!",
    "Thou villainous heap of questions with no answers! May thy pages stick together for all eternity!",
  ],
  wifi: [
    "Thou beslubbering, signal-dropping miscreant! Thou dost buffering and stutter like a court jester with a stammer!",
    "Forsooth, thou invisible tormentor! Thou art present when needed least and absent when needed most, like a faithless courtier!",
    "Thou foul and wavering connection! Thou art weaker than a candle in a tempest, and twice as useless!",
  ],
  monday: [
    "Thou churlish, dawn-breaking villain! Thou dost arrive each week without invitation, like a pox upon the calendar!",
    "Forsooth, thou most dreaded of days! Thou art the rotten apple at the beginning of every week's barrel!",
    "Thou art the very embodiment of despair wrapped in a day, thou mewling, grey-skied wretch of a morning!",
  ],
  traffic: [
    "Thou lumpish, road-clogging pestilence! Thou dost move slower than a snail dragging a boulder uphill!",
    "Forsooth, thou gridlocked abomination! Thou art a river of misery flowing nowhere at tremendous speed!",
    "Thou art a congregation of carriages going absolutely nowhere, thou crawling, horn-blaring monstrosity!",
  ],
  printer: [
    "Thou pribbling, paper-jamming knave! Thou dost choose to malfunction only in the direst of moments, thou mechanical traitor!",
    "Forsooth, thou ink-wasting demon! Thou art the most unreliable servant since Judas himself!",
    "Thou blinking, beeping harbinger of fury! May thy ink cartridge run dry at every crucial moment!",
  ],
  phone: [
    "Thou battery-draining, screen-cracking miscreant! Thou art more fragile than a courtier's ego and twice as demanding!",
    "Forsooth, thou glowing rectangle of distraction! Thou hast stolen more hours than sleep itself!",
    "Thou notification-spewing tormentor! Thou dost buzz and ping like a trapped hornet with no purpose!",
  ],
  weather: [
    "Thou grey and weeping sky! Thou dost pour misery upon us as though the heavens themselves are displeased with our existence!",
    "Forsooth, thou fickle and treacherous climate! Thou art sunny at dawn and stormy by noon, like a courtier with two faces!",
    "Thou blustering, rain-soaked wretch of an atmosphere! May thy clouds part and reveal nothing but more clouds!",
  ],
};

// ── Helper: pick random item from array ───────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Generate insult based on topic ───────────────────────────
function generateInsult(topic) {
  const lowerTopic = topic.toLowerCase();

  // Check for topic-specific insults first
  for (const key of Object.keys(topicInsults)) {
    if (lowerTopic.includes(key)) {
      return pick(topicInsults[key]);
    }
  }

  // Otherwise build one from the word columns
  const opener = pick(openers);
  const w1 = pick(col1);
  const w2 = pick(col2);
  const w3 = pick(col3);
  const closer = pick(closers);

  // Pick a random sentence structure
  const structures = [
    `${opener} ${w1} ${w2} ${w3}! ${closer}`,
    `${opener} ${w1} ${w2} ${w3}, born of a ${pick(col2)} ${pick(col3)}! ${closer}`,
    `Hark! ${opener} ${w1} ${w2} ${w3} — concerning the matter of ${topic}, thou ${pick(middles)} ${w1} ${w3}! ${closer}`,
    `${opener} ${w1} ${w3}! In the sorry affair of ${topic}, thou art the sorriest ${w2} ${w3} that ever drew breath! ${closer}`,
    `Regarding ${topic}: ${opener} ${w1} ${w2} ${w3}! ${closer}`,
  ];

  return pick(structures);
}

// ── POST /api/insult ──────────────────────────────────────────
app.post("/api/insult", (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== "string") {
    return res.status(400).json({ error: "Prithee, provide a topic to insult!" });
  }

  const cleanTopic = topic.trim().slice(0, 200);

  if (cleanTopic.length === 0) {
    return res.status(400).json({ error: "Thy topic is empty, thou silent knave!" });
  }

  const insult = generateInsult(cleanTopic);
  return res.json({ insult });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎭 Shakespeare Insult Generator running at http://localhost:${PORT}`);
});