"use client";

import { Loader2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Candidate {
  name: string;
  position: string;
  photo_url: string;
  bio: string;
  manifesto: string;
  uploading?: boolean;
}

interface CandidateFormProps {
  candidates: Candidate[];
  categories: string[];
  onAddCandidate: () => void;
  onRemoveCandidate: (index: number) => void;
  onUpdateCandidate: (
    index: number,
    field: keyof Candidate,
    value: string | boolean
  ) => void;
  onUploadImage: (index: number, file: File) => Promise<void>;
}

export default function CandidateForm({
  candidates,
  categories,
  onAddCandidate,
  onRemoveCandidate,
  onUpdateCandidate,
  onUploadImage,
}: CandidateFormProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Candidates</h3>
        <Button
          type="button"
          size="sm"
          onClick={onAddCandidate}
          className="h-7 px-2 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Candidate
        </Button>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            No candidates added yet
          </p>
          <p className="text-xs text-muted-foreground">
            Click &quot;Add Candidate&quot; to add candidates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg bg-muted/30 space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Candidate {index + 1}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveCandidate(index)}
                  className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    value={candidate.name}
                    onChange={(e) =>
                      onUpdateCandidate(index, "name", e.target.value)
                    }
                    placeholder="Candidate name"
                    className="h-8 bg-background text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Position / Category
                  </Label>
                  {categories.length === 0 ? (
                    <div className="h-8 px-3 rounded-md border border-dashed bg-muted/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Add categories first
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={candidate.position}
                      onValueChange={(value) =>
                        onUpdateCandidate(index, "position", value)
                      }
                    >
                      <SelectTrigger className="h-8 bg-background text-sm">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Candidate Photo
                </Label>

                {/* Image Preview - Facebook Style */}
                {candidate.photo_url ? (
                  <div className="relative w-full aspect-square max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-border bg-muted shadow-sm hover:shadow-md transition-shadow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.photo_url}
                      alt={candidate.name || "Candidate"}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => onUpdateCandidate(index, "photo_url", "")}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full aspect-square max-w-xs mx-auto rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center justify-center">
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        No image uploaded
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload and URL Input */}
                <div className="space-y-2">
                  {/* Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          onUploadImage(index, file);
                        }
                      };
                      input.click();
                    }}
                    disabled={candidate.uploading}
                    className="h-8 text-xs w-full"
                  >
                    {candidate.uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1.5" />
                        Upload from Device
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>

                  {/* URL Input with Live Preview */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Paste Image URL
                    </Label>
                    <Input
                      value={candidate.photo_url}
                      onChange={(e) =>
                        onUpdateCandidate(index, "photo_url", e.target.value)
                      }
                      placeholder="https://example.com/photo.jpg"
                      className="h-8 bg-background text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a direct image URL for instant preview
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Bio
                </Label>
                <Textarea
                  value={candidate.bio}
                  onChange={(e) =>
                    onUpdateCandidate(index, "bio", e.target.value)
                  }
                  placeholder="Brief biography..."
                  rows={2}
                  className="bg-background resize-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Manifesto
                </Label>
                <Textarea
                  value={candidate.manifesto}
                  onChange={(e) =>
                    onUpdateCandidate(index, "manifesto", e.target.value)
                  }
                  placeholder="Campaign manifesto..."
                  rows={3}
                  className="bg-background resize-none text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
