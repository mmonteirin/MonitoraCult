#!/usr/bin/env node
/**
 * Migra um arquivo para useTheme + useThemedStyles
 * Uso: node scripts/migrate-theme-file.js screens/TelaConversas.js
 */
const fs = require("fs");
const path = process.argv[2];
if (!path) {
  console.error("Informe o caminho do arquivo");
  process.exit(1);
}

let src = fs.readFileSync(path, "utf8");
if (src.includes("useThemedStyles(")) {
  console.log("skip (já migrado):", path);
  process.exit(0);
}

// Imports Colors
src = src.replace(
  /import\s*\{([^}]*)\}\s*from\s*["']\.\.\/styles\/Colors["'];?\n?/g,
  (match, inner) => {
    const names = inner.split(",").map((n) => n.trim()).filter(Boolean);
    const keep = names.filter((n) => n !== "Colors");
    let out =
      'import { useTheme } from "../context/ThemeContext";\nimport { useThemedStyles } from "../hooks/useThemedStyles";\n';
    if (keep.length) {
      out += `import { ${keep.join(", ")} } from "../styles/Colors";\n`;
    }
    return out;
  }
);

// StyleSheet → factory
const stylePatterns = [
  [/\nconst styles = StyleSheet\.create\(\{/, "\nfunction createThemedScreenStyles(c) {\n  return StyleSheet.create({"],
  [/\nconst styles =\n\tStyleSheet\.create\(\{/, "\nfunction createThemedScreenStyles(c) {\n\treturn StyleSheet.create({"],
  [/\nconst s = StyleSheet\.create\(\{/, "\nfunction createFeedStyles(c) {\n  return StyleSheet.create({"],
];

for (const [re, rep] of stylePatterns) {
  if (re.test(src)) {
    src = src.replace(re, rep);
    break;
  }
}

if (!src.includes("createThemedScreenStyles") && !src.includes("createFeedStyles")) {
  console.log("skip (sem StyleSheet.create):", path);
  process.exit(0);
}

const factoryName = src.includes("createFeedStyles") ? "createFeedStyles" : "createThemedScreenStyles";

// Fechar factory
src = src.replace(/\}\);\s*$/s, "});\n}\n");

const fnIdx = src.indexOf(`function ${factoryName}`);
if (fnIdx !== -1) {
  const before = src.slice(0, fnIdx);
  let after = src.slice(fnIdx);
  after = after.replace(/\bColors\./g, "c.");
  after = after.replace(/#070B14/g, "c.background");
  after = after.replace(/#111827/g, "c.surfaceMuted");
  after = after.replace(/\b#FFF\b/g, "c.onPrimary");
  after = after.replace(/\b#fff\b/g, "c.onPrimary");
  after = after.replace(/"rgba\(255,255,255,0\.08\)"/g, "c.glassStrong");
  after = after.replace(/"rgba\(255,255,255,0\.06\)"/g, "c.glass");
  after = after.replace(/"rgba\(255,255,255,0\.04\)"/g, "c.glass");
  after = after.replace(/"rgba\(255,255,255,0\.07\)"/g, "c.glassBorder");
  src = before + after;
}

const hookBlock = `  const { colors, isDark } = useTheme();\n  const styles = useThemedStyles(${factoryName});\n  const blurTint = isDark ? "dark" : "light";\n`;

if (!src.includes("useThemedStyles(")) {
  const patterns = [
    /(export default function \w+[^{]*\{)\n(\s*const insets)/,
    /(export default function \w+[^{]*\{)\n(\s*const \{)/,
    /(export default function \w+[^{]*\{)\n(\s*const \[)/,
    /(export default function \w+[^{]*\{)\n(\s*const navigation)/,
    /(const \w+ = \(\{[^)]*\}\) => \{)\n(\s*const )/,
    /(const \w+ = \(\) => \{)\n(\s*const )/,
  ];
  let injected = false;
  for (const re of patterns) {
    if (re.test(src)) {
      src = src.replace(re, `$1\n${hookBlock}$2`);
      injected = true;
      break;
    }
  }
  if (!injected) {
    console.warn("warn: hooks não injetados em", path);
  }
}

// Alias s → styles para TelaFeed após migração
if (factoryName === "createFeedStyles") {
  src = src.replace(/\bconst styles = useThemedStyles\(createFeedStyles\);/, "const s = useThemedStyles(createFeedStyles);\n  const styles = s;");
}

const splitIdx = src.indexOf(`function ${factoryName}`);
if (splitIdx !== -1) {
  const jsx = src.slice(0, splitIdx).replace(/\bColors\./g, "colors.");
  src = jsx + src.slice(splitIdx);
}

src = src.replace(/"c\.([a-zA-Z]+)"/g, "c.$1");
src = src.replace(/tint="dark"/g, "tint={blurTint}");
src = src.replace(/tint='dark'/g, "tint={blurTint}");

fs.writeFileSync(path, src);
console.log("migrated:", path);
