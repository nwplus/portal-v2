/**
 * Display names for a project's tools. Devpost's Built With exports as slugs
 * ("react-native", "tailwindcss"); these turn them into the names people write.
 *
 * No imports, so the batch script (`wrapped/calc.ts`) can use it under plain Node, and
 * the docs it writes already hold display names.
 */

/** Tools whose names can't be derived from the slug, keyed with separators removed. */
const TOOL_NAMES: Record<string, string> = {
  "1password": "1Password",
  bcryptjs: "bcrypt.js",
  canvasapi: "Canvas API",
  chatgpt: "ChatGPT",
  computervision: "Computer Vision",
  css3: "CSS3",
  elevenlabs: "ElevenLabs",
  embeddedc: "Embedded C",
  expoio: "Expo",
  expressjs: "Express.js",
  fastapi: "FastAPI",
  finbert: "FinBERT",
  fullcalendar: "FullCalendar",
  gemin: "Gemini",
  geminiapi: "Gemini API",
  gesturecontrol: "Gesture Control",
  github: "GitHub",
  gitlab: "GitLab",
  gmailapi: "Gmail API",
  googlecloud: "Google Cloud",
  googlecloudspeechtotext: "Google Cloud Speech-to-Text",
  graphql: "GraphQL",
  html5: "HTML5",
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
  net: ".NET",
  newsapi: "News API",
  nextjs: "Next.js",
  nodejs: "Node.js",
  npm: "npm",
  numpy: "NumPy",
  openai: "OpenAI",
  opencv: "OpenCV",
  openrouter: "OpenRouter",
  opensmile: "openSMILE",
  pdfkit: "PDFKit",
  pencilkit: "PencilKit",
  phaserjs: "Phaser.js",
  postgresql: "PostgreSQL",
  pyautogui: "PyAutoGUI",
  pypdf2: "PyPDF2",
  pyqt6: "PyQt6",
  pyqtgraph: "PyQtGraph",
  pytest: "pytest",
  pytorch: "PyTorch",
  reactjs: "React",
  restapi: "REST API",
  rubyonrails: "Ruby on Rails",
  scikitlearn: "scikit-learn",
  shadcnui: "shadcn/ui",
  socketio: "Socket.IO",
  springai: "Spring AI",
  springboot: "Spring Boot",
  sqlite: "SQLite",
  swiftui: "SwiftUI",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  tanstack: "TanStack",
  tensorflow: "TensorFlow",
  tensorflowjs: "TensorFlow.js",
  texttospeech: "Text-to-Speech",
  typescript: "TypeScript",
  vscode: "VS Code",
  vuejs: "Vue.js",
  weatherapi: "Weather API",
  webassembly: "WebAssembly",
  wpf: "WPF",
  wxt: "WXT",
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
export function displayNames(stack: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of stack) {
    const name = techDisplayName(raw);
    const key = name.toLowerCase();
    if (key && !byKey.has(key)) byKey.set(key, name);
  }
  return [...byKey.values()];
}
