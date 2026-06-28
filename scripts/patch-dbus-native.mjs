import { readFileSync, writeFileSync, existsSync } from "node:fs";

const path = "node_modules/dbus-native/package.json";

if (!existsSync(path)) {
	process.exit(0);
}

const pkg = JSON.parse(readFileSync(path, "utf8"));

if (pkg.optionalDependencies?.["abstract-socket"]) {
	delete pkg.optionalDependencies["abstract-socket"];
	if (Object.keys(pkg.optionalDependencies).length === 0) {
		delete pkg.optionalDependencies;
	}
	writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
	console.log("[fix-dbus-native] removed optional abstract-socket dependency");
} else {
	console.log("[fix-dbus-native] nothing to do (already absent)");
}