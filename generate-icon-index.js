const fs = require('fs');
const path = require('path');

// Define all icon categories
const spriteDirs = ['action', 'standard', 'utility', 'custom', 'doctype'];

const baseDir = path.join(__dirname, 'assets/icons');
const output = [];

spriteDirs.forEach(category => {
    const spritePath = path.join(baseDir, `${category}-sprite/svg/symbols.svg`);
    if (!fs.existsSync(spritePath)) {
        console.warn(`⚠️  No sprite found for: ${category}`);
        return;
    }

    const content = fs.readFileSync(spritePath, 'utf8');
    const matches = content.matchAll(/<symbol[^>]+id="([\w\-]+)"/g);

    for (const match of matches) {
        const iconName = match[1];

        // Directly check for SVG and PNG in the category folder
        const svgFullPath = path.join(baseDir, category, `${iconName}.svg`);
        const pngFullPath = path.join(baseDir, category, `${iconName}_120.png`);

        const svgPath = fs.existsSync(svgFullPath)
            ? `assets/icons/${category}/${iconName}.svg`
            : null;

        const pngPath = fs.existsSync(pngFullPath)
            ? `assets/icons/${category}/${iconName}_120.png`
            : null;

        const spriteRef = `assets/icons/${category}-sprite/svg/symbols.svg#${iconName}`;
        const xlinkRef = `/apexpages/slds/latest/assets/icons/${category}-sprite/svg/symbols.svg#${iconName}`;

        const iconForClassName = iconName.replaceAll('_','-');

        const entry = {
            name: iconName,
            copyName:`${category}:${iconName}`,
            category,
            sprite: spriteRef,
            xlink: xlinkRef,
            svg: svgPath,
            png: pngPath,
            sldsClass: `slds-icon-${category}-${iconForClassName}`,
            tags: [iconName]
        };

        output.push(entry);
    }
});

// Write output to JSON file
const outputPath = path.join(__dirname, 'icons-index.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ icons-index.json created with ${output.length} icons`);
