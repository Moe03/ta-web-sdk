import * as fs from 'fs/promises';
import * as path from 'path';

async function deleteAllExceptGlobalConsts(rootPath: string, isRoot = true): Promise<void> {
    const items = await fs.readdir(rootPath);
    
    for (const item of items) {
        const itemPath = path.join(rootPath, item);
        const stats = await fs.lstat(itemPath);

        if (stats.isDirectory()) {
            console.log(`item: ${item}`);
            if (isRoot && item === '+global_consts') {
                // Skip the +global_consts directory in the root
                continue;
            } else {
                // Recursively process subdirectory
                await deleteAllExceptGlobalConsts(itemPath, false);
                // Remove the directory after processing its contents
                await fs.rm(itemPath, { recursive: true, force: true });
            }
        } else {
            // Delete files
            await fs.unlink(itemPath);
        }
    }
}

// Example usage:
 deleteAllExceptGlobalConsts('./dist/vg-docker/src').catch(console.error);