"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, Search, ArrowRight } from "lucide-react";
import { Label } from "./ui/label";

interface ScriptureInputPanelProps {
  onSubmit?: (reference: string, text: string) => void;
}

const ScriptureInputPanel = ({
  onSubmit = () => {},
}: ScriptureInputPanelProps) => {
  const [reference, setReference] = useState("");
  const [scriptureText, setScriptureText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to lookup scripture from Bible API
  const lookupScripture = async (ref: string) => {
    setIsLoading(true);
    setError("");

    try {
      if (!ref.trim()) {
        throw new Error("Please enter a scripture reference");
      }

      // Use Bible API to fetch scripture
      const response = await fetch(
        `https://bible-api.com/${encodeURIComponent(ref)}`,
      );

      if (!response.ok) {
        throw new Error(
          "Scripture not found. Please check your reference and try again.",
        );
      }

      const data = await response.json();

      if (!data.text || data.text.trim() === "") {
        throw new Error(
          "Scripture not found. Please check your reference and try again.",
        );
      }

      // Clean up the text by removing extra whitespace and verse numbers
      const cleanText = data.text
        .replace(/\d+:\d+/g, "") // Remove verse numbers like "1:1"
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();

      return cleanText;
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError(
          "Unable to connect to scripture database. Please check your internet connection.",
        );
      } else {
        setError(
          err.message || "An error occurred while looking up the scripture",
        );
      }
      return "";
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = async () => {
    const text = await lookupScripture(reference);
    setScriptureText(text);
  };

  const handleContinue = () => {
    if (scriptureText) {
      onSubmit(reference, scriptureText);
    } else {
      setError("Please lookup a scripture before continuing");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-background">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Scripture Input</CardTitle>
        <CardDescription>
          Enter a biblical passage reference to begin creating your animated
          story.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="scripture-reference">Scripture Reference</Label>
          <div className="flex gap-2">
            <Input
              id="scripture-reference"
              placeholder="e.g. John 3:16 or Psalm 23:1-6"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleLookup}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Looking up..." : "Lookup"}
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter book, chapter, and verse range (e.g., John 3:16 or Psalm
            23:1-6)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scriptureText && (
          <div className="space-y-2">
            <Label>Scripture Text</Label>
            <div className="p-4 border rounded-md bg-muted/30">
              <p className="italic">"{scriptureText}"</p>
              <p className="text-sm text-muted-foreground mt-2">{reference}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!scriptureText || isLoading}
          className="flex items-center gap-2"
        >
          Continue to Script Generation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ScriptureInputPanel;
