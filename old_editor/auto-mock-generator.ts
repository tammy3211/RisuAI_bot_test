// Auto-generate mocks for missing exports
// Run this when you get "does not provide an export" errors

import * as fs from 'fs';
import * as path from 'path';

const STORES_MOCK_PATH = path.join(__dirname, 'stores-mock.ts');

// Add export to stores-mock.ts
function addExportToStoresMock(exportName: string) {
    let content = fs.readFileSync(STORES_MOCK_PATH, 'utf-8');
    
    // Check if already exists
    if (content.includes(`export const ${exportName}`)) {
        console.log(`✅ ${exportName} already exists`);
        return;
    }
    
    // Find the insertion point (before "// Add any other stores")
    const insertPoint = content.indexOf('// Add any other stores');
    
    if (insertPoint === -1) {
        console.error('❌ Could not find insertion point');
        return;
    }
    
    // Add the new export
    const newExport = `export const ${exportName} = writable(null);\n`;
    content = content.slice(0, insertPoint) + newExport + content.slice(insertPoint);
    
    // Also add to default export
    const defaultExportMatch = content.match(/export default \{([^}]+)\}/s);
    if (defaultExportMatch) {
        const exports = defaultExportMatch[1];
        const newDefaultExport = `export default {\n${exports.trim()},\n    ${exportName}\n};`;
        content = content.replace(/export default \{[^}]+\}/s, newDefaultExport);
    }
    
    fs.writeFileSync(STORES_MOCK_PATH, content);
    console.log(`✅ Added ${exportName} to stores-mock.ts`);
}

// Usage example
if (process.argv.length > 2) {
    const exportName = process.argv[2];
    addExportToStoresMock(exportName);
}

export { addExportToStoresMock };
