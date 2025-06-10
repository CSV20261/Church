"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Loader2, RefreshCw, Check, Edit } from "lucide-react";

interface ScriptGenerationPanelProps {
  scriptureReference?: string;
  scriptureText?: string;
  onAccept?: (script: string, scenes: SceneType[]) => void;
  onBack?: () => void;
}

type SceneType = {
  id: string;
  description: string;
  duration: number;
};

const ScriptGenerationPanel = ({
  scriptureReference = "Genesis 1:1-2",
  scriptureText = "In the beginning God created the heavens and the earth. Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
  onAccept = () => {},
  onBack = () => {},
}: ScriptGenerationPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<SceneType[]>([]);
  const [activeTab, setActiveTab] = useState("script");

  // Function to generate AI script based on scripture
  const generateScript = () => {
    setIsGenerating(true);

    // Simulate API call delay with actual scripture-based generation
    setTimeout(() => {
      // Generate script based on the actual scripture text
      const scriptLines = scriptureText
        .split(".")
        .filter((line) => line.trim());
      let generatedScript =
        "NARRATOR: Let us journey through this sacred passage.\n\n";

      const scenes = [];
      let sceneCount = 1;

      scriptLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          generatedScript += `SCENE ${sceneCount}: [Visual representation of: ${trimmedLine}]\n\n`;
          generatedScript += `NARRATOR: ${trimmedLine}.\n\n`;

          scenes.push({
            id: sceneCount.toString(),
            description: `Visual representation of: ${trimmedLine}`,
            duration: Math.max(8, Math.min(15, trimmedLine.length / 8)),
          });

          sceneCount++;
        }
      });

      generatedScript += "NARRATOR: Thus speaks the Word of God.";

      // Add a final reflection scene
      scenes.push({
        id: sceneCount.toString(),
        description: "Peaceful reflection scene with scripture reference",
        duration: 8,
      });

      setScript(generatedScript);
      setScenes(scenes);
      setIsGenerating(false);
      setActiveTab("script");
    }, 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-background">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Script Generation</CardTitle>
          <CardDescription>
            AI will generate a script based on your selected scripture. You can
            edit the script before proceeding.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-4 bg-muted/30 rounded-md">
            <h3 className="text-sm font-medium mb-2">
              Scripture Reference: {scriptureReference}
            </h3>
            <p className="text-sm italic">{scriptureText}</p>
          </div>

          {!script && !isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-muted-foreground mb-6">
                Click the button below to generate a script based on this
                scripture passage.
              </p>
              <Button onClick={generateScript} size="lg">
                Generate Script
              </Button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                Generating your script...
                <br />
                <span className="text-xs">
                  This may take a moment as our AI crafts your story.
                </span>
              </p>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="scenes">Scene Breakdown</TabsTrigger>
              </TabsList>

              <TabsContent value="script" className="mt-4">
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Your generated script will appear here..."
                />
                <div className="flex items-center justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" /> Edit Script
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="scenes" className="mt-4">
                <div className="space-y-4">
                  {scenes.map((scene) => (
                    <Card key={scene.id} className="bg-muted/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">Scene {scene.id}</h3>
                          <span className="text-xs text-muted-foreground">
                            {scene.duration}s
                          </span>
                        </div>
                        <p className="text-sm">{scene.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>

        <Separator />

        <CardFooter className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>

          <div className="flex gap-2">
            {script && (
              <Button
                variant="outline"
                onClick={generateScript}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
            )}

            <Button
              onClick={() => onAccept(script, scenes)}
              disabled={!script || isGenerating}
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" /> Accept Script
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ScriptGenerationPanel;
