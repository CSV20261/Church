const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "logs/voice/generator.log" }),
    new winston.transports.Console(),
  ],
});

class VoiceoverGenerator {
  constructor() {
    this.provider = process.env.TTS_PROVIDER || "polly";
    this.sceneAudioMap = new Map();
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case "polly":
        this.polly = new AWS.Polly({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || "us-east-1",
        });
        break;
      case "azure":
        // Azure Speech SDK initialization would go here
        break;
      case "elevenlabs":
        // ElevenLabs API initialization would go here
        break;
      default:
        throw new Error(`Unsupported TTS provider: ${this.provider}`);
    }
  }

  /**
   * Sanitize user input to prevent injection attacks
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== "string") {
      throw new Error("Text input must be a string");
    }

    // Remove potentially dangerous characters and limit length
    const sanitized = text
      .replace(/[<>\"'&]/g, "") // Remove HTML/XML characters
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .trim()
      .substring(0, 3000); // Limit to 3000 characters

    if (sanitized.length === 0) {
      throw new Error("Text input cannot be empty after sanitization");
    }

    return sanitized;
  }

  /**
   * Validate voice parameters
   * @param {Object} params - Voice parameters
   * @returns {Object} - Validated parameters
   */
  validateVoiceParams(params = {}) {
    const validGenders = ["male", "female", "neutral"];
    const validTones = ["neutral", "cheerful", "sad", "excited", "calm"];
    const validPaces = ["slow", "medium", "fast"];

    return {
      gender: validGenders.includes(params.gender) ? params.gender : "neutral",
      tone: validTones.includes(params.tone) ? params.tone : "neutral",
      pace: validPaces.includes(params.pace) ? params.pace : "medium",
      voice: params.voice || "Joanna", // Default Polly voice
    };
  }

  /**
   * Generate audio using Amazon Polly
   * @param {string} text - Text to convert to speech
   * @param {Object} voiceParams - Voice parameters
   * @returns {Buffer} - Audio buffer
   */
  async generateWithPolly(text, voiceParams) {
    const params = {
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voiceParams.voice,
      Engine: "neural",
    };

    // Adjust voice based on parameters
    if (voiceParams.pace !== "medium") {
      const rate = voiceParams.pace === "slow" ? "80%" : "120%";
      params.Text = `<speak><prosody rate=\"${rate}\">${text}</prosody></speak>`;
      params.TextType = "ssml";
    }

    try {
      const result = await this.polly.synthesizeSpeech(params).promise();
      return result.AudioStream;
    } catch (error) {
      logger.error("Polly synthesis failed:", error);
      throw new Error(`TTS generation failed: ${error.message}`);
    }
  }

  /**
   * Generate voiceover audio
   * @param {string} text - Text to convert to speech
   * @param {Object} voiceParams - Voice parameters
   * @param {number} sceneNumber - Scene number for mapping
   * @returns {Object} - Audio file info
   */
  async generateVoiceover(text, voiceParams = {}, sceneNumber = null) {
    try {
      // Sanitize input
      const sanitizedText = this.sanitizeText(text);
      const validatedParams = this.validateVoiceParams(voiceParams);

      logger.info("Generating voiceover", {
        textLength: sanitizedText.length,
        sceneNumber,
        voiceParams: validatedParams,
      });

      // Generate audio based on provider
      let audioBuffer;
      switch (this.provider) {
        case "polly":
          audioBuffer = await this.generateWithPolly(
            sanitizedText,
            validatedParams,
          );
          break;
        default:
          throw new Error(`Provider ${this.provider} not implemented`);
      }

      // Generate unique filename
      const audioId = uuidv4();
      const filename = `${audioId}.mp3`;
      const filepath = path.join("temp", "audio", filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });

      // Save audio file
      await fs.writeFile(filepath, audioBuffer);

      // Map scene to audio file if scene number provided
      if (sceneNumber !== null) {
        this.sceneAudioMap.set(sceneNumber, filename);
      }

      const audioInfo = {
        audioId,
        filename,
        filepath,
        sceneNumber,
        duration: null, // Would need audio analysis to determine
        size: audioBuffer.length,
        createdAt: new Date().toISOString(),
      };

      logger.info("Voiceover generated successfully", audioInfo);
      return audioInfo;
    } catch (error) {
      logger.error("Voiceover generation failed:", error);
      throw error;
    }
  }

  /**
   * Get audio filename for a scene
   * @param {number} sceneNumber - Scene number
   * @returns {string|null} - Audio filename or null if not found
   */
  getSceneAudio(sceneNumber) {
    return this.sceneAudioMap.get(sceneNumber) || null;
  }

  /**
   * Get all scene-to-audio mappings
   * @returns {Object} - Scene to audio filename mappings
   */
  getSceneAudioMap() {
    return Object.fromEntries(this.sceneAudioMap);
  }

  /**
   * Clear temporary audio files
   * @param {Array} audioIds - Array of audio IDs to clear
   */
  async clearTempAudio(audioIds = []) {
    try {
      for (const audioId of audioIds) {
        const filepath = path.join("temp", "audio", `${audioId}.mp3`);
        try {
          await fs.unlink(filepath);
          logger.info(`Cleared temp audio: ${audioId}`);
        } catch (error) {
          logger.warn(`Failed to clear temp audio ${audioId}:`, error.message);
        }
      }
    } catch (error) {
      logger.error("Error clearing temp audio:", error);
    }
  }
}

module.exports = VoiceoverGenerator;
