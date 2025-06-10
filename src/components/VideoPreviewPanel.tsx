"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Share2,
  Edit3,
  Clock,
} from "lucide-react";

interface VideoPreviewPanelProps {
  videoUrl?: string;
  isGenerating?: boolean;
  generationProgress?: number;
  scenes?: {
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
  }[];
}

const VideoPreviewPanel = ({
  videoUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  isGenerating = false,
  generationProgress = 70,
  scenes = [
    {
      id: "1",
      title: "Introduction",
      duration: 15,
      thumbnail:
        "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?w=400&q=80",
    },
    {
      id: "2",
      title: "Main Scene",
      duration: 30,
      thumbnail:
        "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=400&q=80",
    },
    {
      id: "3",
      title: "Conclusion",
      duration: 15,
      thumbnail:
        "https://images.unsplash.com/photo-1504333638930-c8787321eee0?w=400&q=80",
    },
  ],
}: VideoPreviewPanelProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [activeTab, setActiveTab] = useState("preview");
  const [selectedScene, setSelectedScene] = useState<string | null>(null);

  // Total duration in seconds (sum of all scenes)
  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSceneSelect = (sceneId: string) => {
    setSelectedScene(sceneId);
    // In a real implementation, this would seek the video to the start of this scene
    const selectedSceneIndex = scenes.findIndex(
      (scene) => scene.id === sceneId,
    );
    const timeBeforeScene = scenes
      .slice(0, selectedSceneIndex)
      .reduce((acc, scene) => acc + scene.duration, 0);
    setCurrentTime(timeBeforeScene);
  };

  return (
    <Card className="w-full bg-background">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Video Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-10">
            <div className="text-xl font-medium">Generating Your Video...</div>
            <Progress value={generationProgress} className="w-full max-w-md" />
            <div className="text-sm text-muted-foreground">
              {generationProgress}% Complete
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              {/* Video Player */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <img
                  src={videoUrl}
                  alt="Video preview"
                  className="h-full w-full object-cover"
                />
                {/* Play button overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-16 w-16 rounded-full bg-primary/20 backdrop-blur-sm hover:bg-primary/30"
                      onClick={handlePlayPause}
                    >
                      <Play className="h-8 w-8 text-primary-foreground" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={totalDuration}
                    step={1}
                    onValueChange={handleTimeChange}
                    className="flex-1"
                  />
                  <span className="text-sm">{formatTime(totalDuration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentTime(Math.max(0, currentTime - 10))
                      }
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentTime(
                          Math.min(totalDuration, currentTime + 10),
                        )
                      }
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Volume</span>
                    <Slider
                      value={[volume]}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              {/* Scene Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Scene Timeline</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      Adjust Timing
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit Transitions
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className={`flex cursor-pointer items-center space-x-3 rounded-md border p-3 transition-colors ${selectedScene === scene.id ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                      onClick={() => handleSceneSelect(scene.id)}
                    >
                      <div className="h-16 w-24 overflow-hidden rounded-md">
                        <img
                          src={scene.thumbnail}
                          alt={scene.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{scene.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {scene.duration} seconds
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-between p-6">
        <Button variant="outline" disabled={isGenerating}>
          Back to Customization
        </Button>

        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isGenerating}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Your Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Select Platform</h4>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Share Now</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            Download Video
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VideoPreviewPanel;
