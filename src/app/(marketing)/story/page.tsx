import type { Metadata } from "next";
import { StoryPage } from "./StoryPage";

export const metadata: Metadata = {
  title: "Story · Claim Check",
  description: "Why the morning review of AI-written outreach needs Claim Check, how it works, and what it should move.",
};

export default function Page() {
  return <StoryPage />;
}
