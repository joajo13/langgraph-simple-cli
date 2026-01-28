---
name: User Profile
description: Ability to learn and remember information about the user, such as their name, preferences, and other personal details.
icon: 👤
version: 1.0.0
---

# User Profile Skill

This skill allows you to maintain a persistent memory of the user's personal information, preferences, and other relevant details.

## Capabilities

1.  **Read Profile**: Retrieve the current information known about the user.
2.  **Update Profile**: Update specific fields (like name, email) in the profile.
3.  **Add Memory**: Add general notes or memories about the user (e.g., "User likes concise answers", "User is a TypeScript developer").

## Best Practices

*   **Always Check Profile**: When interacting with the user, refer to their profile to personalize your responses.
*   **Proactive Learning**: If the user mentions a preference or a fact about themselves, save it to their profile.
*   **Structured vs Unstructured**: Use `update_profile_field` for structured data (name, email) and `add_user_memory` for unstructured facts.
*   **Privacy**: Only store information that the user explicitly provides or that is directly relevant to assisting them.
