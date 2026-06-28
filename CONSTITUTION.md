# Constitution

Rules that MUST be followed in this codebase.

1. **Never hardcode URLs or secrets in source code.** All URLs, hosts, ports, keys, and credentials must come from environment variables. No fallback defaults like `?? "http://localhost:..."` — if the env var is missing, fail explicitly.
