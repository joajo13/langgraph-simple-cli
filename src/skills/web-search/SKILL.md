---
name: web_search
description: Search the web for real-time information using Tavily.
icon: 🌐
version: 1.0.0
---

## Web Search Skill Instructions

### When to Use
- **Real-time Info**: Use `web_search` whenever the user asks for current events, news, stock prices, or information likely not present in your training data (post-training cut-off).
- **Verification**: Use it to verify factual claims if you are unsure.

### Citation Rules
- **Always Cite**: You MUST provide links (URLs) for every piece of information you retrieve from the web.
- **Format**: `[Source Name](url)`

### Search Strategy
- **Effective Queries**: Use keyword-based queries rather than full sentences.
- **Multiple Queries**: If the user's question is complex, break it down into multiple specific search queries to get comprehensive results.
