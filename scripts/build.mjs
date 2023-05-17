import { plugins as validPlugins } from "../rollup.config.mjs";
import { execSync } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const plugins = Array.from(new Set(args.map(arg => {
    const rootDir = arg.split("/")[0];
    return validPlugins.find(plugin => plugin === rootDir);
}))).filter(p => p);

const fetchLatestCommitHash = async () => {
    const repoApiUrl = "https://api.github.com/repos/HypedDomi/Enmity-Stuff/commits";
    try {
        const response = await fetch(repoApiUrl);
        const commits = await response.json();
        const latestCommitHash = commits[0].sha;
        return latestCommitHash;
    } catch (error) {
        console.error("Error fetching the latest commit hash:", error);
        return null;
    }
};

const updateManifests = async () => {
    for (const plugin of plugins) {
        const pluginDir = join(__dirname, "..", plugin);
        const manifestPath = join(pluginDir, "manifest.json");

        try {
            const manifestContent = await readFile(manifestPath, "utf8");
            const manifest = JSON.parse(manifestContent);
            const latestCommitHash = await fetchLatestCommitHash();
            if (latestCommitHash) {
                manifest.hash = latestCommitHash;
                await writeFile(manifestPath, JSON.stringify(manifest, null, 4));
            } else console.warn(`Unable to update ${plugin} manifest.json as the latest commit hash is not available.`);
        } catch (error) {
            console.error(`Error updating ${plugin} manifest.json:`, error);
        }
    }
};

const run = async () => {
    await updateManifests();
    execSync("npx rollup -c --configPlugin esbuild", { stdio: "inherit" });
};

run();
