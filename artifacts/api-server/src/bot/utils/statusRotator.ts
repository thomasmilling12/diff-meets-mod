import { Client, ActivityType } from "discord.js";

const statuses = [
  { name: "Moderating | /help", type: ActivityType.Playing },
  { name: "your server", type: ActivityType.Watching },
  { name: "/ban • /kick • /mute", type: ActivityType.Listening },
  { name: "DIFF Meets Mod", type: ActivityType.Playing },
  { name: "for rule breakers", type: ActivityType.Watching },
];

let index = 0;

export function startStatusRotator(client: Client): void {
  const rotate = () => {
    const status = statuses[index % statuses.length];
    client.user?.setActivity(status.name, { type: status.type });
    index++;
  };
  rotate();
  setInterval(rotate, 30_000);
}
