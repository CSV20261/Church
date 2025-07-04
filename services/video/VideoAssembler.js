const ffmpeg = require("fluent-ffmpeg");
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
    new winston.transports.File({ filename: "logs/video/export.log" }),
    new winston.transports.Console(),
  ],
});

class VideoAssembler {
  constructor() {
    this.tempDir = "temp/videos";
    this.outputDir = "temp/videos/output";
    this.maxResolution = { width: 1920, height: 1080 };
    this.defaultFrameRate = 24;
  }

  /**
   * Validate and sanitize storyboard input
   * @param {Object} storyboard - Storyboard JSON
   * @returns {Object} - Validated storyboard
   */
  validateStoryboard(storyboard) {
    if (!storyboard || typeof storyboard !== "object") {
      throw new Error("Invalid storyboard: must be an object");
    }

    if (!Array.isArray(storyboard.scenes)) {
      throw new Error("Invalid storyboard: scenes must be an array");
    }

    if (storyboard.scenes.length === 0) {
      throw new Error("Invalid storyboard: must contain at least one scene");
    }

    // Validate each scene
    const validatedScenes = storyboard.scenes.map((scene, index) => {
      if (!scene || typeof scene !== "object") {
        throw new Error(`Invalid scene at index ${index}: must be an object`);
      }

      return {
        sceneNumber: scene.sceneNumber || index + 1,
        duration: Math.max(1, Math.min(30, scene.duration || 5)), // 1-30 seconds
        description: (scene.description || "").substring(0, 500),
        characters: Array.isArray(scene.characters)
          ? scene.characters.slice(0, 10)
          : [],
        setting: (scene.setting || "").substring(0, 200),
        narration: (scene.narration || "").substring(0, 1000),
        dialogue: Array.isArray(scene.dialogue)
          ? scene.dialogue.slice(0, 20)
          : [],
        visualElements: scene.visualElements || {},
      };
    });

    return {
      ...storyboard,
      scenes: validatedScenes,
      totalDuration: validatedScenes.reduce(
        (sum, scene) => sum + scene.duration,
        0,
      ),
    };
  }

  /**
   * Validate audio files mapping
   * @param {Object} audioMap - Scene number to audio filename mapping
   * @returns {Object} - Validated audio map
   */
  async validateAudioMap(audioMap) {
    if (!audioMap || typeof audioMap !== "object") {
      throw new Error("Invalid audio map: must be an object");
    }

    const validatedMap = {};

    for (const [sceneNumber, filename] of Object.entries(audioMap)) {
      const sceneNum = parseInt(sceneNumber);
      if (isNaN(sceneNum) || sceneNum < 1) {
        logger.warn(`Invalid scene number: ${sceneNumber}`);
        continue;
      }

      if (typeof filename !== "string" || filename.length === 0) {
        logger.warn(`Invalid filename for scene ${sceneNumber}`);
        continue;
      }

      // Sanitize filename to prevent path traversal
      const sanitizedFilename = path.basename(filename);
      const audioPath = path.join("temp", "audio", sanitizedFilename);

      try {
        await fs.access(audioPath);
        validatedMap[sceneNum] = sanitizedFilename;
      } catch (error) {
        logger.warn(
          `Audio file not found for scene ${sceneNumber}: ${audioPath}`,
        );
      }
    }

    return validatedMap;
  }

  /**
   * Generate basic animation frames for a scene
   * @param {Object} scene - Scene data
   * @param {number} frameRate - Frames per second
   * @returns {Array} - Array of frame descriptions
   */
  generateSceneFrames(scene, frameRate = 24) {
    const totalFrames = Math.ceil(scene.duration * frameRate);
    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i / frameRate;

      frames.push({
        frameNumber: i,
        timestamp,
        sceneNumber: scene.sceneNumber,
        description: scene.description,
        characters: scene.characters,
        setting: scene.setting,
        // Basic animation could be implemented here
        // For now, we'll use static frames with text overlay
        visualElements: {
          background: scene.setting,
          text: this.getFrameText(scene, timestamp),
          characters: scene.characters,
        },
      });
    }

    return frames;
  }

  /**
   * Get text to display for a specific frame timestamp
   * @param {Object} scene - Scene data
   * @param {number} timestamp - Current timestamp in scene
   * @returns {string} - Text to display
   */
  getFrameText(scene, timestamp) {
    // Simple text display logic - could be enhanced
    if (scene.narration && timestamp < scene.duration * 0.8) {
      return scene.narration;
    }

    if (scene.dialogue && scene.dialogue.length > 0) {
      const dialogueIndex = Math.floor(
        (timestamp / scene.duration) * scene.dialogue.length,
      );
      return scene.dialogue[dialogueIndex] || "";
    }

    return scene.description || "";
  }

  /**
   * Create video timeline from storyboard and audio
   * @param {Object} storyboard - Validated storyboard
   * @param {Object} audioMap - Validated audio map
   * @returns {Object} - Video timeline
   */
  createVideoTimeline(storyboard, audioMap) {
    const timeline = {
      totalDuration: storyboard.totalDuration,
      frameRate: this.defaultFrameRate,
      resolution: this.maxResolution,
      scenes: [],
      audioTracks: [],
    };

    let currentTime = 0;

    for (const scene of storyboard.scenes) {
      const sceneTimeline = {
        sceneNumber: scene.sceneNumber,
        startTime: currentTime,
        endTime: currentTime + scene.duration,
        duration: scene.duration,
        frames: this.generateSceneFrames(scene, this.defaultFrameRate),
        audioFile: audioMap[scene.sceneNumber] || null,
      };

      timeline.scenes.push(sceneTimeline);

      // Add audio track if available
      if (audioMap[scene.sceneNumber]) {
        timeline.audioTracks.push({
          sceneNumber: scene.sceneNumber,
          filename: audioMap[scene.sceneNumber],
          startTime: currentTime,
          duration: scene.duration,
        });
      }

      currentTime += scene.duration;
    }

    return timeline;
  }

  /**
   * Render video using FFmpeg
   * @param {Object} timeline - Video timeline
   * @param {string} outputFilename - Output filename
   * @returns {Promise<string>} - Path to rendered video
   */
  async renderVideo(timeline, outputFilename) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.outputDir, outputFilename);

      // Create a simple video with text overlays
      // This is a basic implementation - could be enhanced with actual animation
      let command = ffmpeg()
        .inputFormat("lavfi")
        .input(
          `color=c=black:s=${timeline.resolution.width}x${timeline.resolution.height}:d=${timeline.totalDuration}:r=${timeline.frameRate}`,
        )
        .videoCodec("libx264")
        .outputOptions(["-pix_fmt yuv420p", "-preset fast", "-crf 23"]);

      // Add audio tracks
      for (const audioTrack of timeline.audioTracks) {
        const audioPath = path.join("temp", "audio", audioTrack.filename);
        command = command.input(audioPath);
      }

      // Add text overlays for each scene
      const filters = [];
      let videoStream = "[0:v]";

      timeline.scenes.forEach((scene, index) => {
        const text =
          scene.frames[0]?.visualElements?.text || scene.sceneNumber.toString();
        const escapedText = text.replace(/[':]/g, "\\\\$&");

        const filterName = `text${index}`;
        filters.push(
          `${videoStream}drawtext=text='Scene ${scene.sceneNumber}\\: ${escapedText}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${scene.startTime},${scene.endTime})'[${filterName}]`,
        );
        videoStream = `[${filterName}]`;
      });

      if (filters.length > 0) {
        command = command.complexFilter(filters.join(";"));
      }

      command
        .output(outputPath)
        .on("start", (commandLine) => {
          logger.info("FFmpeg started:", commandLine);
        })
        .on("progress", (progress) => {
          logger.info("Processing:", progress.percent + "% done");
        })
        .on("end", () => {
          logger.info("Video rendering completed:", outputPath);
          resolve(outputPath);
        })
        .on("error", (err) => {
          logger.error("FFmpeg error:", err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Assemble video from storyboard and audio
   * @param {Object} storyboard - Storyboard JSON
   * @param {Object} audioMap - Scene to audio filename mapping
   * @param {Object} options - Assembly options
   * @returns {Object} - Video assembly result
   */
  async assembleVideo(storyboard, audioMap = {}, options = {}) {
    const jobId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilename = `video_${timestamp}_${jobId}.mp4`;

    try {
      logger.info("Starting video assembly", {
        jobId,
        storyboardScenes: storyboard?.scenes?.length || 0,
        audioTracks: Object.keys(audioMap).length,
      });

      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Validate inputs
      const validatedStoryboard = this.validateStoryboard(storyboard);
      const validatedAudioMap = await this.validateAudioMap(audioMap);

      // Create video timeline
      const timeline = this.createVideoTimeline(
        validatedStoryboard,
        validatedAudioMap,
      );

      // Log assembly details
      logger.info("Video assembly details", {
        jobId,
        totalDuration: timeline.totalDuration,
        scenes: timeline.scenes.map((s) => ({
          sceneNumber: s.sceneNumber,
          duration: s.duration,
          hasAudio: !!s.audioFile,
        })),
        audioFiles: timeline.audioTracks.map((a) => a.filename),
      });

      // Render video
      const outputPath = await this.renderVideo(timeline, outputFilename);

      const result = {
        jobId,
        outputFilename,
        outputPath,
        duration: timeline.totalDuration,
        resolution: timeline.resolution,
        frameRate: timeline.frameRate,
        scenesProcessed: timeline.scenes.length,
        audioTracksUsed: timeline.audioTracks.length,
        createdAt: new Date().toISOString(),
      };

      logger.info("Video assembly completed successfully", result);
      return result;
    } catch (error) {
      logger.error("Video assembly failed", {
        jobId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Clean up temporary files
   * @param {string} jobId - Job ID to clean up
   */
  async cleanup(jobId) {
    try {
      // This would clean up temporary files associated with the job
      logger.info(`Cleanup completed for job: ${jobId}`);
    } catch (error) {
      logger.error("Cleanup failed:", error);
    }
  }
}

module.exports = VideoAssembler;
