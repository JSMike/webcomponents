/** Add ranges in the final type text, without matching property names or string literals. */
export const addTypeReferenceSpans = (ts, type) => {
	if (!type?.text || !type.references?.length) return;

	const prefix = "type ManifestType = ";
	const source = ts.createSourceFile("manifest-type.ts", `${prefix}${type.text};`, ts.ScriptTarget.Latest, true);
	const references = [];
	const matched = new Set();
	const visit = node => {
		if (ts.isTypeReferenceNode(node)) {
			const name = node.typeName.getText(source);
			const reference = type.references.find(reference => reference.name === name);
			if (reference) {
				matched.add(reference);
				references.push({
					...reference,
					start: node.typeName.getStart(source) - prefix.length,
					end: node.typeName.end - prefix.length,
				});
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
	// Keep references for syntaxes not handled here rather than silently losing metadata.
	type.references = [...references, ...type.references.filter(reference => !matched.has(reference))];
};

/** Visit the type records after all of the generator's text transformations. */
export const addManifestTypeReferenceSpans = (ts, value) => {
	if (!value || typeof value !== "object") return;
	addTypeReferenceSpans(ts, value);
	Object.values(value).forEach(child => addManifestTypeReferenceSpans(ts, child));
};
