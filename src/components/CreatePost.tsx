import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Image, Video, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  profile: any;
  onPostCreated: () => void;
}

export const CreatePost = ({ profile, onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Post cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("posts").insert({
      user_id: profile.id,
      content: content.trim(),
    });

    if (error) {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Post created!",
      });
      setContent("");
      onPostCreated();
    }
    setIsSubmitting(false);
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
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Image className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
