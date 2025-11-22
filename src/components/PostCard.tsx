import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Repeat2, Share2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: any;
  currentUserId: string;
}

export const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [repostsCount, setRepostsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadPostData();
  }, [post.id]);

  const loadPostData = async () => {
    // Check if user liked
    const { data: likeData } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .maybeSingle();
    setLiked(!!likeData);

    // Check if user reposted
    const { data: repostData } = await supabase
      .from("post_reposts")
      .select("*")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .maybeSingle();
    setReposted(!!repostData);

    // Get counts
    const { count: likes } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    setLikesCount(likes || 0);

    const { count: reposts } = await supabase
      .from("post_reposts")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    setRepostsCount(reposts || 0);

    const { data: commentsData, count: commentsTotal } = await supabase
      .from("post_comments")
      .select(`
        *,
        profiles!post_comments_user_id_fkey(full_name, school, major)
      `, { count: "exact" })
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });
    setComments(commentsData || []);
    setCommentsCount(commentsTotal || 0);
  };

  const handleLike = async () => {
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      setLiked(false);
      setLikesCount(likesCount - 1);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      setLiked(true);
      setLikesCount(likesCount + 1);
    }
  };

  const handleRepost = async () => {
    if (reposted) {
      await supabase.from("post_reposts").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      setReposted(false);
      setRepostsCount(repostsCount - 1);
      toast({ title: "Repost removed" });
    } else {
      await supabase.from("post_reposts").insert({ post_id: post.id, user_id: currentUserId });
      setReposted(true);
      setRepostsCount(repostsCount + 1);
      toast({ title: "Reposted!" });
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from("post_comments").insert({
      post_id: post.id,
      user_id: currentUserId,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      loadPostData();
      toast({ title: "Comment added!" });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/post/" + post.id);
    toast({ title: "Link copied to clipboard!" });
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border p-6 mb-4">
      <div className="flex gap-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-foreground/10 text-foreground">
            {post.profiles?.full_name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("") || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="mb-3">
            <h4 className="font-semibold text-foreground">{post.profiles?.full_name}</h4>
            <p className="text-sm text-muted-foreground">
              {post.profiles?.major} • {post.profiles?.school}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
          <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
          
          {/* Media Display */}
          {post.media_url && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border">
              {post.media_type === "image" ? (
                <img 
                  src={post.media_url} 
                  alt="Post media" 
                  className="w-full max-h-[500px] object-cover"
                />
              ) : post.media_type === "video" ? (
                <video 
                  src={post.media_url} 
                  controls 
                  className="w-full max-h-[500px]"
                />
              ) : null}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground mb-3 pb-3 border-b border-border">
            {likesCount > 0 && <span>{likesCount} likes</span>}
            {commentsCount > 0 && <span>{commentsCount} comments</span>}
            {repostsCount > 0 && <span>{repostsCount} reposts</span>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
            >
              <Heart className={`w-4 h-4 mr-2 ${liked ? "fill-current" : ""}`} />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Comment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              className={reposted ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-foreground"}
            >
              <Repeat2 className="w-4 h-4 mr-2" />
              Repost
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] bg-background/50 border-border resize-none"
                />
                <Button onClick={handleComment} size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 pl-4 border-l-2 border-border">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-foreground/10 text-foreground text-xs">
                      {comment.profiles?.full_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{comment.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
