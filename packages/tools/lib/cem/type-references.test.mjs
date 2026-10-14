import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import processEvent from "./event.mjs";
import config from "./custom-elements-manifest.config.mjs";
import { addTypeReferenceSpans } from "./type-references.mjs";

test("compound types reference each occurrence, not property names or string literals", () => {
	const text = 'Detail | { Detail: Detail[]; label: "Detail" } | Promise<Detail>';
	const reference = { name: "Detail", package: "example", module: "dist/Detail.js" };
	const type = { text, references: [reference] };
	addTypeReferenceSpans(ts, type);
	assert.deepEqual(type.references.map(({ start, end }) => [start, end]), [[0, 6], [19, 25], [57, 63]]);
	for (const ref of type.references) {
		assert.equal(text.slice(ref.start, ref.end), ref.name);
		assert.equal(ref.module, reference.module);
	}
});

test("whole types and qualified references receive exact ranges", () => {
	for (const text of ["Detail", "Detail[]", "ns.Detail | undefined", "`prefix-${Detail}`"]) {
		const name = text.includes("ns.") ? "ns.Detail" : "Detail";
		const type = { text, references: [{ name, package: "example" }] };
		addTypeReferenceSpans(ts, type);
		assert.equal(type.references.length, 1);
		assert.equal(text.slice(type.references[0].start, type.references[0].end), name);
	}
});

test("Button click gets global CustomEvent and detail spans through the generator hook", () => {
	const source = ts.createSourceFile("src/Button.ts", readFileSync(new URL("../../../main/src/Button.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
	const classNode = source.statements.find(node => ts.isClassDeclaration(node) && node.name.text === "Button");
	const event = ts.getDecorators(classNode).find(node => node.expression.expression.getText() === "event" && node.expression.arguments[0].text === "click");
	const moduleDoc = { path: "src/Button.ts", declarations: [], exports: [] };
	const result = processEvent(ts, event, classNode, moduleDoc);
	moduleDoc.declarations.push({ name: "Button", events: [result] });
	config.plugins[0].moduleLinkPhase({ ts, moduleDoc });
	assert.equal(result.type.text, "CustomEvent<ButtonClickEventDetail>");
	assert.deepEqual(result.type.references.map(({ name, start, end }) => ({ name, start, end })), [
		{ name: "CustomEvent", start: 0, end: 11 },
		{ name: "ButtonClickEventDetail", start: 12, end: 34 },
	]);
	assert.equal(result.type.references[0].package, "global:");
	assert.equal(result.type.references[1].module, "dist/Button.js");
});

test("native and undocumented events retain their explicit global references", () => {
	for (const [comment, expected] of [["/** @native */", "Event"], ["", "CustomEvent"]]) {
		const source = ts.createSourceFile("src/Test.ts", `${comment}\n@event("change") class Test {}`, ts.ScriptTarget.Latest, true);
		const classNode = source.statements[0];
		const result = processEvent(ts, ts.getDecorators(classNode)[0], classNode, { path: "src/Test.ts" });
		assert.deepEqual(result.type.references, [{ name: expected, package: "global:" }]);
	}
});

test("named and default exports of one class only register its tag once", () => {
	const moduleDoc = {
		path: "src/Example.ts",
		declarations: [{ name: "Example", customElement: true, tagName: "ui5-example" }],
		exports: ["default", "Example"].map(name => ({
			kind: "js", name, declaration: { name: "Example", module: "src/Example.ts" },
		})),
	};
	config.plugins[0].moduleLinkPhase({ ts, moduleDoc });
	assert.equal(moduleDoc.exports.filter(item => item.kind === "custom-element-definition").length, 1);
	assert.equal(moduleDoc.exports.filter(item => item.kind === "js").length, 2);
});
