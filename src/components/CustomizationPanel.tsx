"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Play, Volume2, VolumeX } from "lucide-react";

interface CustomizationPanelProps {
  onComplete?: () => void;
  onBack?: () => void;
}

const CustomizationPanel = ({
  onComplete = () => {},
  onBack = () => {},
}: CustomizationPanelProps) => {
  const [selectedArtStyle, setSelectedArtStyle] = useState("cartoon");
  const [selectedCharacterStyle, setSelectedCharacterStyle] =
    useState("modern");
  const [selectedVoice, setSelectedVoice] = useState("male1");
  const [volume, setVolume] = useState([80]);

  const artStyles = [
    {
      id: "cartoon",
      name: "Cartoon",
      image:
        "https://images.unsplash.com/photo-1569017388730-020b5f80a004?w=400&q=80",
    },
    {
      id: "watercolor",
      name: "Watercolor",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80",
    },
    {
      id: "minimalist",
      name: "Minimalist",
      image:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    },
    {
      id: "children",
      name: "Children's Book",
      image:
        "https://images.unsplash.com/photo-1629196914168-3100be76b805?w=400&q=80",
    },
  ];

  const characterStyles = [
    {
      id: "modern",
      name: "Modern",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80",
    },
    {
      id: "historical",
      name: "Historical",
      image:
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&q=80",
    },
    {
      id: "stylized",
      name: "Stylized",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    },
  ];

  const voices = [
    { id: "male1", name: "Male Voice 1", sample: "#" },
    { id: "male2", name: "Male Voice 2", sample: "#" },
    { id: "female1", name: "Female Voice 1", sample: "#" },
    { id: "female2", name: "Female Voice 2", sample: "#" },
    { id: "narrator", name: "Narrator", sample: "#" },
  ];

  const playVoiceSample = (sampleUrl: string) => {
    // In a real implementation, this would play an audio sample
    console.log("Playing voice sample:", sampleUrl);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-background">
      <h2 className="text-3xl font-bold mb-6">Customize Your Video</h2>
      <p className="text-muted-foreground mb-8">
        Personalize the look and sound of your biblical animation
      </p>

      <Tabs defaultValue="art-style" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="art-style">Art Style</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="voice">Voice & Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="art-style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Art Style</CardTitle>
              <CardDescription>
                Choose the visual style for your biblical animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {artStyles.map((style) => (
                  <div
                    key={style.id}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedArtStyle === style.id ? "border-primary ring-2 ring-primary" : "border-border"}`}
                    onClick={() => setSelectedArtStyle(style.id)}
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={style.image}
                        alt={style.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-center">
                      <h3 className="font-medium">{style.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="characters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Character Design</CardTitle>
              <CardDescription>
                Select the character style for your biblical figures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedCharacterStyle}
                onValueChange={setSelectedCharacterStyle}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {characterStyles.map((style) => (
                  <div key={style.id} className="relative">
                    <RadioGroupItem
                      value={style.id}
                      id={style.id}
                      className="absolute top-2 right-2 z-10"
                    />
                    <Label
                      htmlFor={style.id}
                      className="cursor-pointer block rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                    >
                      <div className="aspect-square w-full overflow-hidden">
                        <img
                          src={style.image}
                          alt={style.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium">{style.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Character style
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Selection</CardTitle>
              <CardDescription>
                Choose the narrator voice for your biblical story
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedVoice}
                onValueChange={setSelectedVoice}
                className="space-y-3"
              >
                {voices.map((voice) => (
                  <div
                    key={voice.id}
                    className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={voice.id} id={voice.id} />
                      <Label htmlFor={voice.id} className="cursor-pointer">
                        {voice.name}
                      </Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playVoiceSample(voice.sample)}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-4 w-4" />
                      <span>Sample</span>
                    </Button>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-8">
                <h3 className="font-medium mb-4">Audio Settings</h3>
                <div className="flex items-center gap-4">
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <span className="w-12 text-right">{volume}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete}>Continue to Preview</Button>
      </div>
    </div>
  );
};

export default CustomizationPanel;
