# Colombia-Bot (TypeScript)

Converted to **TypeScript** and **ES Modules**.

## Requirements
- Node.js 18+
- npm

## Install
```bash
npm install
```

## Development
```bash
npm run dev
```
> Runs the bot with `ts-node` (entry: `src/bot.ts`).

## Build & Run (Production)
```bash
npm run build
npm start
```
> Compiles to `dist/` and runs `node dist/bot.js`.

## Project Structure
```
src/
  bot.ts
  client.ts
  discord.ts
  routes.ts
  commands/
    audioCommand.ts
    leaveCommand.ts
    playCommand.ts
  utils/
    activityChannel.ts
    audioUtils.ts
    config.ts
    globalCommands.ts
    onlybot.ts
    replyChannel.ts
dist/ (compiled output)
```

## Notes
- All original JavaScript files were migrated to `.ts`. Basic typings were added (`any` where necessary) to keep strict mode enabled.
- Imports/exports are modernized to ESM.
- Keep your environment variables and Discord token the same as before.
