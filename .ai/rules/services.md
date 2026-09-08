---
paths:
  - 'app/Services/**,config/services.php,.env.example'
---

# Services

## Keep AI providers strictly free-tier
AI integrations must not call paid providers or use paid fallbacks. Scanner and chat are locked to the documented Gemini Free Tier model; when free quota or provider access fails, return an error or use the local non-billing fallback. Do not reintroduce Groq without an explicit change to this policy.
