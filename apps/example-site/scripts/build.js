const { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join, dirname } = require('path');

function copyRecursive(src, dest) {
	const stats = statSync(src);
	if (stats.isDirectory()) {
		mkdirSync(dest, { recursive: true });
		for (const entry of readdirSync(src)) {
			copyRecursive(join(src, entry), join(dest, entry));
		}
	} else {
		mkdirSync(dirname(dest), { recursive: true });
		writeFileSync(dest, readFileSync(src));
	}
}

const srcDir = join(process.cwd(), 'public');
const outDir = join(process.cwd(), 'dist');
copyRecursive(srcDir, outDir);
console.log('Built example site to', outDir);