import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Image, Video, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  profile: any;
  onPostCreated: () => void;
}

export const CreatePost = ({ profile, onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleMediaSelect = (file: File, type: "image" | "video") => {
    setMediaFile(file);
    setMediaType(type);
    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);
  };

  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast({
        title: "Post cannot be empty",
        description: "Add some text or media to your post",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaUrl = null;
      let uploadedMediaType = null;

      // Upload media if present
      if (mediaFile && mediaType) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('post-media')
          .upload(fileName, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        uploadedMediaType = mediaType;
      }

      // Create post
      const { error } = await supabase.from("posts").insert({
        user_id: profile.id,
        content: content.trim(),
        media_url: mediaUrl,
        media_type: uploadedMediaType,
      });

      if (error) throw error;

      toast({
        title: "Post created!",
      });
      setContent("");
      removeMedia();
      onPostCreated();
    } catch (error: any) {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border p-6 mb-6">
      <div className="flex gap-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-foreground/10 text-foreground">
            {profile.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-background/50 border-border resize-none"
          />
          
          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden bg-background/50 border border-border">
              {mediaType === "image" ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-cover" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-96" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMediaSelect(file, "image");
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMediaSelect(file, "video");
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => imageInputRef.current?.click()}
                disabled={!!mediaFile}
              >
                <Image className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!mediaFile}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !mediaFile)}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
