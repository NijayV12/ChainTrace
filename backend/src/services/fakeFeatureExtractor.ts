import type { SocialAccount, ActivityLog } from "@prisma/client";
import {
  extractFakeFeatures as extractSharedFakeFeatures,
  type FakeFeatures,
} from "chaintrace-ai-engine";

export function extractFakeFeatures(
  account: SocialAccount,
  activity: ActivityLog[]
): FakeFeatures {
  return extractSharedFakeFeatures(
    {
      handle: account.handle,
      createdAt: account.createdAt,
      profileComplete: account.profileComplete,
      followers: account.followers,
      following: account.following,
      posts: account.posts,
    },
    activity
  );
}
