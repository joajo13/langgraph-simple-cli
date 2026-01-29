import { z } from "zod";
import { tool } from "@langchain/core/tools";
import * as fs from 'fs';
import * as path from 'path';
import { logger } from "../../logger";

const PROFILE_PATH = path.join(process.cwd(), '.user_profile.json');

export interface UserProfile {
    memories?: string[];
    [key: string]: any;
}

export function loadProfile(): UserProfile {
    try {
        if (fs.existsSync(PROFILE_PATH)) {
            const data = fs.readFileSync(PROFILE_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        logger.error("Failed to load user profile", e);
    }
    return { memories: [] };
}

function saveProfile(profile: UserProfile): void {
    try {
        fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
    } catch (e) {
        logger.error("Failed to save user profile", e);
        throw e;
    }
}

export function updateProfileField(key: string, value: any): string {
    const profile = loadProfile();
    // Prevent overwriting 'memories' directly via this tool to be safe, though not strictly required
    if (key === 'memories') {
        return "Cannot overwrite 'memories' directly. Use 'add_user_memory' instead.";
    }
    profile[key] = value;
    saveProfile(profile);
    return `Successfully updated user profile: ${key} = ${value}`;
}

export function addUserMemory(memory: string): string {
    const profile = loadProfile();
    if (!profile.memories) profile.memories = [];
    // Simple check to avoid duplicates
    if (!profile.memories.includes(memory)) {
        profile.memories.push(memory);
        saveProfile(profile);
        return "Added new memory about the user.";
    }
    return "Memory already exists.";
}

export const createProfileTools = () => [
    tool(async () => {
        const profile = loadProfile();
        return JSON.stringify(profile, null, 2);
    }, {
        name: "get_user_profile",
        description: "Retrieve all stored information about the current user, including name, preferences, and memories.",
        schema: z.object({}),
    }),
    tool(async ({ key, value }) => {
        return updateProfileField(key, value);
    }, {
        name: "update_profile_field",
        description: "Update or set a specific structured field in the user's profile (e.g., name, email, location, theme_preference).",
        schema: z.object({
            key: z.string().describe("The field name to set (e.g. 'name', 'email')"),
            value: z.string().describe("The value to set"),
        }),
    }),
    tool(async ({ memory }) => {
       return addUserMemory(memory);
    }, {
        name: "add_user_memory",
        description: "Add a unstructured memory, fact, or preference about the user that doesn't fit into a specific key-value field.",
        schema: z.object({
            memory: z.string().describe("The fact or memory to record"),
        })
    })
];
