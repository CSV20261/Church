# Biblical Scripture Video Story Generator

A Next.js application that transforms biblical scriptures into engaging 3-5 minute cartoon-style video stories through AI-powered automation, enabling non-technical users to create high-quality animated biblical narratives.

## 🎯 Features

- **Scripture Input Interface**: Easy passage lookup and AI-driven script generation
- **Customization Panel**: Select art styles, character designs, and voice options
- **Preview Player**: Timeline editor for adjusting scenes and pacing
- **Export Functionality**: Download videos or share directly to social platforms
- **Wizard-based UI**: Simple flow from scripture selection to final video generation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- FFmpeg (for video processing)
- AWS account (for text-to-speech via Polly)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CSV20261/Church.git
cd Church
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# AI/OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-3.5-turbo

# AWS Configuration (for text-to-speech)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# TTS Provider
TTS_PROVIDER=polly

# Logging
LOG_LEVEL=info

# Next.js
NEXT_PUBLIC_TEMPO=true
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

### Root Directory

- **`package.json`** - Project dependencies and scripts
- **`next.config.js`** - Next.js configuration with Tempo integration
- **`tailwind.config.ts`** - Tailwind CSS configuration with custom theme
- **`tsconfig.json`** - TypeScript configuration
- **`components.json`** - ShadCN UI components configuration
- **`tempo.config.json`** - Tempo platform typography and styling configuration
- **`postcss.config.js`** - PostCSS configuration for Tailwind
- **`jest.config.js`** - Jest testing framework configuration
- **`.gitignore`** - Git ignore rules including Tempo-specific exclusions
- **`.env.example`** - Environment variables template

### Source Code (`src/`)

#### Application (`src/app/`)
- **`layout.tsx`** - Root layout component with Tempo integration and error handling
- **`page.tsx`** - Main application page with 4-step wizard interface
- **`globals.css`** - Global CSS styles and Tailwind imports
- **`favicon.ico`** - Application favicon

#### Components (`src/components/`)
- **`ScriptureInputPanel.tsx`** - Step 1: Scripture passage input and lookup
- **`ScriptGenerationPanel.tsx`** - Step 2: AI-powered script generation from scripture
- **`CustomizationPanel.tsx`** - Step 3: Art style, character, and voice customization
- **`VideoPreviewPanel.tsx`** - Step 4: Video preview and export functionality
- **`tempo-init.tsx`** - Tempo platform initialization component
- **`theme-switcher.tsx`** - Dark/light theme toggle component

#### UI Components (`src/components/ui/`)
ShadCN UI component library including:
- **`button.tsx`** - Customizable button component
- **`card.tsx`** - Card container component
- **`tabs.tsx`** - Tab navigation component
- **`input.tsx`** - Form input component
- **`textarea.tsx`** - Multi-line text input
- **`select.tsx`** - Dropdown selection component
- **`progress.tsx`** - Progress bar component
- **`dialog.tsx`** - Modal dialog component
- **`alert.tsx`** - Alert notification component
- **`badge.tsx`** - Status badge component
- **`avatar.tsx`** - User avatar component
- **`accordion.tsx`** - Collapsible content component
- **`carousel.tsx`** - Image/content carousel
- **`calendar.tsx`** - Date picker calendar
- **`checkbox.tsx`** - Checkbox input component
- **`dropdown-menu.tsx`** - Context menu component
- **`hover-card.tsx`** - Hover tooltip card
- **`navigation-menu.tsx`** - Navigation menu component
- **`popover.tsx`** - Popover overlay component
- **`radio-group.tsx`** - Radio button group
- **`scroll-area.tsx`** - Custom scrollable area
- **`separator.tsx`** - Visual separator line
- **`sheet.tsx`** - Slide-out panel component
- **`skeleton.tsx`** - Loading skeleton component
- **`slider.tsx`** - Range slider input
- **`switch.tsx`** - Toggle switch component
- **`table.tsx`** - Data table component
- **`toast.tsx`** - Toast notification system
- **`tooltip.tsx`** - Tooltip component
- **`toggle.tsx`** - Toggle button component
- **`icons.tsx`** - Icon component definitions
- **`use-toast.ts`** - Toast hook for notifications

#### Utilities (`src/lib/`)
- **`utils.ts`** - Utility functions including Tailwind class merging

### Services (`services/`)

#### AI Services (`services/ai/`)
- **`SummarizerService.js`** - Bible passage summarization and storyboard generation
- **`README.md`** - AI services documentation

#### Video Services (`services/video/`)
- **`VideoAssembler.js`** - FFmpeg-based video assembly from storyboards and audio

#### Voice Services (`services/voice/`)
- **`VoiceoverGenerator.js`** - Text-to-speech generation using AWS Polly

### Testing (`tests/`)
- **`services/ai/SummarizerService.test.js`** - Unit tests for AI summarization service

### Logs (`logs/`)
- **`ai/summarizer.log`** - AI service operation logs
- **`video/export.log`** - Video assembly operation logs
- **`voice/generator.log`** - Voice generation operation logs

### Tempo Integration (`src/app/tempobook/`)
- **`storyboards/`** - Tempo canvas storyboard components for visual development
- **`dynamic/`** - Dynamic Tempo-generated components (excluded from git)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|----------|
| `OPENAI_API_KEY` | OpenAI API key for script generation | Yes | - |
| `AI_MODEL` | AI model to use | No | `gpt-3.5-turbo` |
| `AWS_ACCESS_KEY_ID` | AWS access key for Polly TTS | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for Polly TTS | Yes | - |
| `AWS_REGION` | AWS region | No | `us-east-1` |
| `TTS_PROVIDER` | Text-to-speech provider | No | `polly` |
| `LOG_LEVEL` | Logging level | No | `info` |
| `NEXT_PUBLIC_TEMPO` | Enable Tempo integration | No | `true` |

### Supported TTS Providers

- **Amazon Polly** (default) - High-quality neural voices
- **Azure Speech** (planned) - Microsoft's speech synthesis
- **ElevenLabs** (planned) - AI-powered voice cloning

## 🎨 User Interface Flow

### Step 1: Scripture Input
- Enter biblical passage reference (e.g., "John 3:16-18")
- Automatic scripture text lookup
- Manual text input option

### Step 2: Script Generation
- AI-powered narrative script creation
- Theological depth options (basic, standard, theological)
- Script editing and refinement

### Step 3: Customization
- **Art Styles**: Cartoon, realistic, minimalist, watercolor
- **Character Designs**: Modern, traditional, diverse, stylized
- **Voice Options**: Male, female, neutral with tone variations

### Step 4: Preview & Export
- Real-time video preview
- Timeline editing for scene timing
- Export options: MP4 download, social media sharing

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run tests
npm test

# Lint code
npm run lint
```

### Architecture

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with ShadCN UI components
- **State Management**: React hooks and context
- **AI Integration**: OpenAI API for script generation
- **Text-to-Speech**: AWS Polly for voiceover generation
- **Video Processing**: FFmpeg for video assembly
- **Development Platform**: Tempo for visual component development

### Key Dependencies

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Pre-built component library
- **Lucide React** - Icon library
- **AWS SDK** - Amazon Web Services integration
- **FFmpeg** - Video processing library
- **Winston** - Logging library
- **UUID** - Unique identifier generation
- **Tempo Devtools** - Visual development platform integration

## 📝 API Services

### SummarizerService

```javascript
const summarizer = new SummarizerService({
  apiKey: 'your-openai-key',
  model: 'gpt-3.5-turbo',
  language: 'en',
  theologicalDepth: 'standard'
});

const result = await summarizer.processPassage('John 3:16', scriptureText);
```

### VoiceoverGenerator

```javascript
const voiceGen = new VoiceoverGenerator();
const audio = await voiceGen.generateVoiceover(
  'Scripture text to speak',
  { gender: 'male', tone: 'calm', pace: 'medium' },
  sceneNumber
);
```

### VideoAssembler

```javascript
const assembler = new VideoAssembler();
const video = await assembler.assembleVideo(
  storyboardData,
  audioFileMap,
  { resolution: { width: 1920, height: 1080 } }
);
```

## 🔒 Security

- Input sanitization for all user-provided text
- Path traversal protection for file operations
- API key validation and secure storage
- Rate limiting on AI API calls
- Temporary file cleanup after processing

## 📊 Logging

All services include comprehensive logging:
- **AI Operations**: Script generation, summarization
- **Voice Generation**: TTS processing, file creation
- **Video Assembly**: FFmpeg operations, timeline creation
- **Error Tracking**: Detailed error logs with stack traces

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the logs directory for error details
- Review environment variable configuration

## 🔮 Roadmap

- [ ] Multi-language support for international audiences
- [ ] Advanced animation styles and transitions
- [ ] Custom character creation tools
- [ ] Batch processing for multiple scriptures
- [ ] Social media integration for direct sharing
- [ ] Mobile app companion
- [ ] Advanced timeline editing features
- [ ] Custom voice training and cloning
- [ ] Collaborative editing features
- [ ] Analytics and usage tracking

---

**Built with ❤️ for spreading biblical stories through modern technology**
