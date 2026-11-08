import { textWidth } from "@/lib/wrapped/text-width";

/**
 * What the tech-stack slide shows: a project's tools, tidied for display and fitted to the
 * comp's slots.
 *
 * Devpost's Built With exports as slugs ("react-native", "tailwindcss"), which the script
 * stores as is. They're tidied here rather than there so a naming fix needs no regeneration.
 * Kept pure, away from `scenes.ts`, so it's testable.
 */

/** Tools whose names can't be derived from the slug, keyed with separators removed. */
const TOOL_NAMES: Record<string, string> = {
  "1password": "1Password",
  bcryptjs: "bcrypt.js",
  canvasapi: "Canvas API",
  chatgpt: "ChatGPT",
  computervision: "Computer Vision",
  elevenlabs: "ElevenLabs",
  embeddedc: "Embedded C",
  expoio: "Expo",
  expressjs: "Express.js",
  fastapi: "FastAPI",
  finbert: "FinBERT",
  fullcalendar: "FullCalendar",
  geminiapi: "Gemini API",
  gemin: "Gemini",
  gesturecontrol: "Gesture Control",
  github: "GitHub",
  gitlab: "GitLab",
  gmailapi: "Gmail API",
  googlecloud: "Google Cloud",
  googlecloudspeechtotext: "Google Cloud Speech-to-Text",
  graphql: "GraphQL",
  huggingface: "Hugging Face",
  indexeddb: "IndexedDB",
  ionos: "IONOS",
  javascript: "JavaScript",
  langchain: "LangChain",
  langgraph: "LangGraph",
  loveable: "Lovable",
  mediapipe: "MediaPipe",
  mongodb: "MongoDB",
  mysql: "MySQL",
  nestjs: "NestJS",
  newsapi: "News API",
  nextjs: "Next.js",
  nodejs: "Node.js",
  npm: "npm",
  numpy: "NumPy",
  openai: "OpenAI",
  opencv: "OpenCV",
  opensmile: "openSMILE",
  phaserjs: "Phaser.js",
  postgresql: "PostgreSQL",
  pypdf2: "PyPDF2",
  pytest: "pytest",
  pytorch: "PyTorch",
  reactjs: "React",
  restapi: "REST API",
  scikitlearn: "scikit-learn",
  shadcnui: "shadcn/ui",
  socketio: "Socket.IO",
  springai: "Spring AI",
  springboot: "Spring Boot",
  sqlite: "SQLite",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  tanstack: "TanStack",
  tensorflow: "TensorFlow",
  texttospeech: "Text-to-Speech",
  typescript: "TypeScript",
  vscode: "VS Code",
  vuejs: "Vue.js",
  weatherapi: "Weather API",
  webassembly: "WebAssembly",
};

/** Words inside a multi-word slug that aren't simply capitalized: "lcd-display" → "LCD Display". */
const TOOL_WORDS: Record<string, string> = {
  "3d": "3D",
  aes: "AES",
  ai: "AI",
  api: "API",
  aws: "AWS",
  css: "CSS",
  dom: "DOM",
  gcp: "GCP",
  html: "HTML",
  json: "JSON",
  jwt: "JWT",
  lcd: "LCD",
  ml: "ML",
  rest: "REST",
  restful: "RESTful",
  ros: "ROS",
  sql: "SQL",
  tts: "TTS",
  ui: "UI",
};

const known = (table: Record<string, string>, key: string) =>
  Object.hasOwn(table, key) ? table[key] : undefined;

/**
 * A tool's display name. Anything with a capital is someone's deliberate spelling, or one of
 * our detected AI tools, so only all-lowercase names are touched.
 */
export function techDisplayName(raw: string): string {
  const name = raw.trim();
  if (name !== name.toLowerCase()) return name;
  return (
    known(TOOL_NAMES, name.replace(/[\s./-]/g, "")) ??
    name
      .replace(/-/g, " ")
      .replace(
        /[^\s/]+/g,
        (word) => known(TOOL_WORDS, word) ?? word.charAt(0).toUpperCase() + word.slice(1),
      )
  );
}

/** Tidied names, deduped again since two slugs can land on one name ("react", "react.js"). */
function displayNames(stack: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of stack) {
    const name = techDisplayName(raw);
    const key = name.toLowerCase();
    if (key && !byKey.has(key)) byKey.set(key, name);
  }
  return [...byKey.values()];
}

/**
 * Width a name may take, in comp pixels. Names start at x≈720, and a tall phone stretches the
 * stage so its sides are cropped: 390x844 shows up to x≈983.
 */
const NAME_MAX_WIDTH = 250;
/** The comp's size for these names, as drawn: 100 on layers scaled to 50%. */
const NAME_SIZE = 50;
const NAME_MIN_SIZE = 30;
const LAYER_SCALE = 0.5;
/** The comps draw their text at this weight, whatever After Effects baked (see `withWebfont`). */
const NAME_WEIGHT = 800;

const nameWidth = (line: string, size: number) => textWidth(line, size, NAME_WEIGHT);
const widestLine = (lines: string[]) =>
  Math.max(0, ...lines.map((line) => nameWidth(line, NAME_SIZE)));

/** Splits a name that won't fit on one line at its most even space, hyphen or slash. */
function breakName(name: string): string[] {
  if (nameWidth(name, NAME_SIZE) <= NAME_MAX_WIDTH) return [name];
  let best = [name];
  for (const { index } of name.matchAll(/[\s/-]/g)) {
    const first = name.slice(0, name[index] === " " ? index : index + 1);
    const split = [first, name.slice(index + 1)];
    if (widestLine(split) < widestLine(best)) best = split;
  }
  return best;
}

/** Past the smallest size there's nothing left to give, so the line is cut. */
function clampLine(line: string): string {
  if (nameWidth(line, NAME_MIN_SIZE) <= NAME_MAX_WIDTH) return line;
  let kept = line;
  while (kept && nameWidth(`${kept}…`, NAME_MIN_SIZE) > NAME_MAX_WIDTH) kept = kept.slice(0, -1);
  return `${kept}…`;
}

export type FittedTechStack = {
  /** One entry per filled slot; `\r` is After Effects' line break. */
  names: string[];
  /** The font size for every slot, in the layers' own units. */
  layerSize: number;
};

/**
 * Fits the first `slots` tools to the slide: at most two lines each, all at one size so the
 * rows still read as a list.
 *
 * @param stack - the project's tools, as stored
 * @param slots - how many tools the comp can show
 * @returns the text and shared font size for the comp's text layers
 */
export function fitTechStack(stack: string[], slots: number): FittedTechStack {
  const lines = displayNames(stack)
    .slice(0, slots)
    .map((name) => breakName(name).map(clampLine));
  const widest = widestLine(lines.flat());
  const fitted = widest > 0 ? (NAME_SIZE * NAME_MAX_WIDTH) / widest : NAME_SIZE;
  const size = Math.floor(Math.min(NAME_SIZE, Math.max(NAME_MIN_SIZE, fitted)));
  return {
    names: lines.map((name) => name.join("\r")),
    layerSize: size / LAYER_SCALE,
  };
}
