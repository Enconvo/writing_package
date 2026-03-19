---
name: writing_package
description: >
  AI-powered writing toolkit with commands for grammar/spelling correction, text editing, rewriting, tone adjustment, summarization, proofreading, key point extraction, format conversion, and dictation polishing via configurable LLM providers.
metadata:
  author: EnconvoAI
  version: "0.0.259"
---

## API Reference

Just use the `local_api` tool to request these APIs.

To view full parameter details for a specific endpoint, run: `node skills/scripts/api_detail.cjs <endpoint-path>`

| Endpoint | Description |
|----------|-------------|
| `writing_package/emoji` | Give An Emoji Suggestion for given text |
| `writing_package/explain` | Explain the text |
| `writing_package/screenshot_explain` | Explain the selected area |
| `writing_package/summarize` | Summarize the text |
| `writing_package/fix_spelling_and_grammar` | Fix Spelling and Grammar |
| `writing_package/ai_edit` | AI Edit |
| `writing_package/improve_writing` | Improve Writing |
| `writing_package/polish` | Improve Writing |
| `writing_package/make_longer` | expand the text to make it longer |
| `writing_package/make_shorter` | Make Shorter |
| `writing_package/change_tone_to_friendly` | Change Tone to Friendly |
| `writing_package/change_tone_to_confident` | Change Tone to Confident |
| `writing_package/change_tone_to_casual` | Change Tone to Casual |
| `writing_package/proofread` | Proofread the text |
| `writing_package/rewrite` | Rewrite the text |
| `writing_package/change_tone_to_professional` | Change Tone to Professional |
| `writing_package/make_concise` | Make the text more concise |
| `writing_package/extract_key_points` | Extract key points from the text |
| `writing_package/convert_to_list` | Convert the text to a list format |
| `writing_package/convert_to_table` | Convert the text to a table format |
| `writing_package/dictation_polish` | Clean up voice input text by removing filler words and fixing typos |
| `writing_package/dictation_translate` | Translate voice input text into the target language |

