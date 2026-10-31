import { existsSync } from "node:fs";
import path from "node:path";

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);
const ESLINT_CONFIG_NAMES = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs"];

/** Returns the workspace package directory (e.g. "apps/web") a staged file belongs to. */
function packageDirOf(absoluteFile) {
  const relative = path.relative(process.cwd(), absoluteFile).split(path.sep).join("/");
  const [root, name] = relative.split("/");
  if (root !== "apps" && root !== "packages") return null;
  return `${root}/${name}`;
}

function hasEslintConfig(dir) {
  return ESLINT_CONFIG_NAMES.some((name) => existsSync(path.join(dir, name)));
}

function quote(file) {
  return `"${file}"`;
}

export default {
  // A single glob key keeps the commands sequential: Prettier formats every
  // staged file first, then ESLint fixes the code files, each run from its
  // own package folder so it picks up that package's ESLint config.
  "*": (filenames) => {
    const commands = [`prettier --write --ignore-unknown ${filenames.map(quote).join(" ")}`];

    const filesByPackage = new Map();
    for (const filename of filenames) {
      if (!CODE_EXTENSIONS.has(path.extname(filename))) continue;

      const dir = packageDirOf(filename);
      if (!dir || !hasEslintConfig(dir)) continue;

      const files = filesByPackage.get(dir) ?? [];
      files.push(filename);
      filesByPackage.set(dir, files);
    }

    for (const [dir, files] of filesByPackage) {
      commands.push(`pnpm --dir ${dir} exec eslint --fix ${files.map(quote).join(" ")}`);
    }

    return commands;
  },
};
