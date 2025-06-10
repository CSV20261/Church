const SummarizerService = require("../../../services/ai/SummarizerService");
const fs = require("fs");
const path = require("path");

// Mock winston to avoid file system issues in tests
jest.mock("winston", () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    File: jest.fn(),
  },
}));

describe("SummarizerService", () => {
  let summarizerService;
  const mockPassage = "John 3:16-18";
  const mockText =
    "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";

  beforeEach(() => {
    summarizerService = new SummarizerService({
      apiKey: "test-key",
      model: "gpt-3.5-turbo",
    });
  });

  describe("Constructor", () => {
    test("should initialize with default values", () => {
      const service = new SummarizerService();
      expect(service.language).toBe("en");
      expect(service.theologicalDepth).toBe("standard");
      expect(service.model).toBe("gpt-3.5-turbo");
    });

    test("should initialize with custom options", () => {
      const service = new SummarizerService({
        language: "es",
        theologicalDepth: "theological",
        model: "gpt-4",
      });
      expect(service.language).toBe("es");
      expect(service.theologicalDepth).toBe("theological");
      expect(service.model).toBe("gpt-4");
    });
  });

  describe("processPassage", () => {
    test("should process passage and return expected structure", async () => {
      const result = await summarizerService.processPassage(
        mockPassage,
        mockText,
      );

      expect(result).toHaveProperty("passage", mockPassage);
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("storyboard");
      expect(result).toHaveProperty("metadata");

      expect(typeof result.summary).toBe("string");
      expect(Array.isArray(result.storyboard)).toBe(true);
      expect(result.metadata).toHaveProperty("language");
      expect(result.metadata).toHaveProperty("theologicalDepth");
      expect(result.metadata).toHaveProperty("processedAt");
      expect(result.metadata).toHaveProperty("processingTimeMs");
    });

    test("should handle errors gracefully", async () => {
      // Mock an error in generateSummary
      jest
        .spyOn(summarizerService, "generateSummary")
        .mockRejectedValue(new Error("API Error"));

      await expect(
        summarizerService.processPassage(mockPassage, mockText),
      ).rejects.toThrow("API Error");
    });
  });

  describe("generateSummary", () => {
    test("should return a string summary", async () => {
      const summary = await summarizerService.generateSummary(mockText);
      expect(typeof summary).toBe("string");
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe("generateStoryboard", () => {
    test("should return an array of scenes", async () => {
      const storyboard = await summarizerService.generateStoryboard(
        mockText,
        mockPassage,
      );

      expect(Array.isArray(storyboard)).toBe(true);
      expect(storyboard.length).toBeGreaterThan(0);

      // Check first scene structure
      const firstScene = storyboard[0];
      expect(firstScene).toHaveProperty("sceneNumber");
      expect(firstScene).toHaveProperty("sceneDescription");
      expect(firstScene).toHaveProperty("characters");
      expect(firstScene).toHaveProperty("narration");
      expect(firstScene).toHaveProperty("dialogue");

      expect(typeof firstScene.sceneNumber).toBe("number");
      expect(typeof firstScene.sceneDescription).toBe("string");
      expect(Array.isArray(firstScene.characters)).toBe(true);
      expect(typeof firstScene.narration).toBe("string");
    });
  });

  describe("buildSummaryPrompt", () => {
    test("should build prompt with correct language and depth", () => {
      const prompt = summarizerService.buildSummaryPrompt(mockText);
      expect(prompt).toContain("en");
      expect(prompt).toContain("standard");
      expect(prompt).toContain(mockText);
    });

    test("should adapt to different theological depths", () => {
      summarizerService.theologicalDepth = "theological";
      const prompt = summarizerService.buildSummaryPrompt(mockText);
      expect(prompt).toContain("theological context");
    });
  });

  describe("buildStoryboardPrompt", () => {
    test("should build storyboard prompt with passage reference", () => {
      const prompt = summarizerService.buildStoryboardPrompt(
        mockText,
        mockPassage,
      );
      expect(prompt).toContain(mockPassage);
      expect(prompt).toContain(mockText);
      expect(prompt).toContain("sceneNumber");
      expect(prompt).toContain("characters");
    });
  });

  describe("updateConfig", () => {
    test("should update configuration options", () => {
      summarizerService.updateConfig({
        language: "fr",
        theologicalDepth: "basic",
        model: "gpt-4",
      });

      expect(summarizerService.language).toBe("fr");
      expect(summarizerService.theologicalDepth).toBe("basic");
      expect(summarizerService.model).toBe("gpt-4");
    });
  });

  describe("getStatus", () => {
    test("should return service status", () => {
      const status = summarizerService.getStatus();

      expect(status).toHaveProperty("model");
      expect(status).toHaveProperty("language");
      expect(status).toHaveProperty("theologicalDepth");
      expect(status).toHaveProperty("hasApiKey");
      expect(status).toHaveProperty("version");

      expect(status.hasApiKey).toBe(true);
      expect(status.version).toBe("1.0.0");
    });
  });

  describe("Multi-language support", () => {
    test("should support different languages", () => {
      const spanishService = new SummarizerService({ language: "es" });
      const prompt = spanishService.buildSummaryPrompt(mockText);
      expect(prompt).toContain("es");
    });
  });

  describe("Theological depth modes", () => {
    test("should support basic theological depth", () => {
      const basicService = new SummarizerService({ theologicalDepth: "basic" });
      const prompt = basicService.buildSummaryPrompt(mockText);
      expect(prompt).toContain("simple, accessible");
    });

    test("should support theological depth mode", () => {
      const theologicalService = new SummarizerService({
        theologicalDepth: "theological",
      });
      const prompt = theologicalService.buildSummaryPrompt(mockText);
      expect(prompt).toContain("theological context");
    });
  });
});
