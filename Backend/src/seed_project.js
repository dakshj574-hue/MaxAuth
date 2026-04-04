/**
 * Seed script to create initial project for MaxAuth.
 */
import { registerProject } from './services/project.service.js';

async function seed() {
    try {
        console.log('Seeding initial project...');
        const result = await registerProject({
            name: 'Default MaxAuth Project',
            ownerEmail: 'admin@maxauth.dev'
        });
        
        console.log('Project created successfully!');
        console.log('----------------------------------------------------');
        console.log(`PROJECT ID: ${result.project.id}`);
        console.log(`API KEY: ${result.apiKey}`);
        console.log('----------------------------------------------------');
        console.log('IMPORTANT: Save this API key. It will not be shown again.');
        console.log('You must pass this key as the "x-api-key" header for all requests.');
        process.exit(0);
    } catch (e) {
        console.error('Failed to seed project:', e);
        process.exit(1);
    }
}

seed();
