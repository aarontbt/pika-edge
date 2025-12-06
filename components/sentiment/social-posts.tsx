"use client";

import { ExternalLink, MessageCircle, Repeat2, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SocialPost = {
  postId: string;
  authorHandle: string;
  authorName?: string;
  content: string;
  postedAt: number;
  url: string;
  metrics?: {
    likes?: number;
    reposts?: number;
    replies?: number;
  };
};

type SocialPostsProps = {
  posts?: SocialPost[] | null;
  lastUpdated?: number | null;
  isLoading?: boolean;
};

export function SocialPosts({ posts, lastUpdated, isLoading }: SocialPostsProps) {
  if (isLoading) {
    return <SocialPostsSkeleton />;
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="p-4 border-dashed border-muted-foreground/30 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          No recent posts found on X.com for this item.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      )}
      {posts.slice(0, 3).map((post) => (
        <Card key={post.postId} className="p-4 bg-card/70">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">
                {post.authorHandle}
                {post.authorName ? (
                  <span className="text-muted-foreground"> · {post.authorName}</span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {post.content}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>
                  {formatDistanceToNow(post.postedAt, { addSuffix: true })}
                </span>
                {renderMetrics(post)}
              </div>
            </div>
            <Link
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function renderMetrics(post: SocialPost) {
  if (!post.metrics) return null;
  const { likes, reposts, replies } = post.metrics;
  return (
    <div className="flex items-center gap-3">
      {likes !== undefined && (
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> {likes}
        </span>
      )}
      {reposts !== undefined && (
        <span className="flex items-center gap-1">
          <Repeat2 className="h-3 w-3" /> {reposts}
        </span>
      )}
      {replies !== undefined && (
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" /> {replies}
        </span>
      )}
    </div>
  );
}

function SocialPostsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-32" />
      {[...Array(3)].map((_, idx) => (
        <Card key={idx} className="p-4 bg-card/70">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}
