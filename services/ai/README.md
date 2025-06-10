# AI Services

## SummarizerService

A modular service for processing Bible passages and generating narrative summaries with storyboards.

### Features

- **Narrative Summaries**: Generate engaging, story-like summaries of Bible passages
- **Storyboard Generation**: Create detailed scene-by-scene breakdowns for video production
- **Multi-language Support**: Process passages in different languages
- **Theological Depth Modes**: Adjust complexity from basic to theological
- **Comprehensive Logging**: Track all inputs and outputs for debugging
- **Extensible Design**: Easy to upgrade or replace with different AI models

### Usage

```javascript
const SummarizerService = require('./SummarizerService');

// Initialize service
const summarizer = new SummarizerService({
  apiKey: process.env.OPENAI_API_KEY,
  language: 'en',
  theologicalDepth: 'standard'
});

// Process a Bible passage
const result = await summarizer.processPassage(
  'John 3:16-18',
  'For God so loved the world...'
);

console.log(result.summary);
console.log(result.storyboard);
```

### Configuration Options

- `apiKey`: Your AI service API key
- `model`: AI model to use (default: 'gpt-3.5-turbo')
- `language`: Target language (default: 'en')
- `theologicalDepth`: 'basic', 'standard', or 'theological'

### Theological Depth Modes

- **Basic**: Simple, accessible summaries for general audiences
- **Standard**: Balanced summaries with key themes and context
- **Theological**: Deep analysis with theological context and scholarly insights

### Multi-language Support

The service supports multiple languages through the `language` parameter:
- English ('en')
- Spanish ('es')
- French ('fr')
- German ('de')
- And more...

### Storyboard Format

Each scene in the storyboard includes:
```json
{
  "sceneNumber": 1,
  "sceneDescription": "Visual description of the scene",
  "characters": ["Character1", "Character2"],
  "narration": "Text to be spoken by narrator",
  "dialogue": "Character dialogue (if applicable)"
}
```

### Logging

All service activity is logged to `logs/ai/summarizer.log` including:
- Input passages and processing parameters
- Output summaries and storyboard metadata
- Processing times and performance metrics
- Error details for debugging

### Testing

Run the test suite:
```bash
npm test tests/services/ai/SummarizerService.test.js
```

### Future Enhancements

The service is designed to support:
- Additional AI model providers (Anthropic, Google, etc.)
- Advanced theological analysis modes
- Custom character and setting preferences
- Integration with video generation APIs
- Batch processing capabilities
