"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ScriptureInputPanel from "@/components/ScriptureInputPanel";
import ScriptGenerationPanel from "@/components/ScriptGenerationPanel";
import CustomizationPanel from "@/components/CustomizationPanel";
import VideoPreviewPanel from "@/components/VideoPreviewPanel";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [activeStep, setActiveStep] = useState("scripture");
  const [scriptureData, setScriptureData] = useState({
    reference: "",
    text: "",
  });
  const [generatedScript, setGeneratedScript] = useState("");
  const [customizationOptions, setCustomizationOptions] = useState({
    artStyle: "cartoon",
    characterDesign: "modern",
    voiceOption: "male",
  });

  const handleScriptureSubmit = (reference: string, text: string) => {
    setScriptureData({ reference, text });
    setActiveStep("script");
  };

  const handleScriptAccept = (script: string) => {
    setGeneratedScript(script);
    setActiveStep("customize");
  };

  const handleCustomizationComplete = (options: any) => {
    setCustomizationOptions(options);
    setActiveStep("preview");
  };

  const navigateToStep = (step: string) => {
    setActiveStep(step);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-background">
      <div className="w-full max-w-7xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Biblical Scripture Video Story Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            Transform biblical scriptures into engaging animated video stories
          </p>
        </header>

        <Card className="w-full bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Create Your Video</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Step{" "}
                  {activeStep === "scripture"
                    ? "1"
                    : activeStep === "script"
                      ? "2"
                      : activeStep === "customize"
                        ? "3"
                        : "4"}{" "}
                  of 4
                </span>
              </div>
            </div>
            <CardDescription>
              Follow the steps below to generate your animated biblical story
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeStep} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger
                  value="scripture"
                  onClick={() => navigateToStep("scripture")}
                  disabled={activeStep === "scripture"}
                >
                  1. Scripture Input
                </TabsTrigger>
                <TabsTrigger
                  value="script"
                  onClick={() => navigateToStep("script")}
                  disabled={!scriptureData.text || activeStep === "scripture"}
                >
                  2. Script Generation
                </TabsTrigger>
                <TabsTrigger
                  value="customize"
                  onClick={() => navigateToStep("customize")}
                  disabled={
                    !generatedScript ||
                    activeStep === "scripture" ||
                    activeStep === "script"
                  }
                >
                  3. Customization
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  onClick={() => navigateToStep("preview")}
                  disabled={
                    activeStep === "scripture" ||
                    activeStep === "script" ||
                    activeStep === "customize"
                  }
                >
                  4. Preview & Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scripture" className="mt-0">
                <ScriptureInputPanel onSubmit={handleScriptureSubmit} />
              </TabsContent>

              <TabsContent value="script" className="mt-0">
                <ScriptGenerationPanel
                  scriptureReference={scriptureData.reference}
                  scriptureText={scriptureData.text}
                  onAccept={handleScriptAccept}
                />
              </TabsContent>

              <TabsContent value="customize" className="mt-0">
                <CustomizationPanel
                  script={generatedScript}
                  onComplete={handleCustomizationComplete}
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <VideoPreviewPanel
                  script={generatedScript}
                  customizationOptions={customizationOptions}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (activeStep === "script") setActiveStep("scripture");
                if (activeStep === "customize") setActiveStep("script");
                if (activeStep === "preview") setActiveStep("customize");
              }}
              disabled={activeStep === "scripture"}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={() => {
                if (activeStep === "scripture" && scriptureData.text)
                  setActiveStep("script");
                if (activeStep === "script" && generatedScript)
                  setActiveStep("customize");
                if (activeStep === "customize") setActiveStep("preview");
              }}
              disabled={
                (activeStep === "scripture" && !scriptureData.text) ||
                (activeStep === "script" && !generatedScript) ||
                activeStep === "preview"
              }
            >
              {activeStep === "preview" ? "Export" : "Continue"}{" "}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
