import { createFileRoute } from "@tanstack/react-router";
import { PulseApp } from "@/components/nba/pulse-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PulseApp />;
}
