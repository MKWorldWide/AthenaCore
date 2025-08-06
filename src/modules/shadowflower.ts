import fs from 'fs';
import path from 'path';
import { logger } from '../lib/athenacore/utils/logger';

export class ShadowFlowerModule {
  private lessonsPath: string;
  private lessonsCache: string[] = [];
  private lastUpdated: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.lessonsPath = path.resolve(
      __dirname,
      '../../../ShadowFlowerCouncil/ShadowFlowerConsole/Lilith.Eve/@lessons-learned.md'
    );
    this.loadLessons();
  }

  private loadLessons(): void {
    try {
      if (Date.now() - this.lastUpdated < this.CACHE_TTL && this.lessonsCache.length > 0) {
        return; // Use cached version
      }

      if (!fs.existsSync(this.lessonsPath)) {
        logger.warn(`Lessons file not found at: ${this.lessonsPath}`);
        return;
      }

      const content = fs.readFileSync(this.lessonsPath, 'utf8');
      this.lessonsCache = content
        .split('\n')
        .filter(line => line.trim().length > 0 && !line.trim().startsWith('#'));
      this.lastUpdated = Date.now();
      logger.info(`Loaded ${this.lessonsCache.length} lessons from ShadowFlower`);
    } catch (error) {
      logger.error('Failed to load lessons:', error);
      this.lessonsCache = [];
    }
  }

  public getRandomLesson(): string {
    this.loadLessons(); // Refresh cache if needed
    
    if (this.lessonsCache.length === 0) {
      return 'No lessons available. The archives are silent...';
    }

    const randomIndex = Math.floor(Math.random() * this.lessonsCache.length);
    return this.lessonsCache[randomIndex].trim();
  }

  public async handleLilithInvoke(): Promise<string> {
    const lesson = this.getRandomLesson();
    return `✨ **Lilith.Eve's Wisdom:**\n${lesson}`;
  }

  public async handleMommyCommand(): Promise<string> {
    // Placeholder for future mommy module integration
    return 'The Mommy module is not yet implemented. Check back soon, my child. 💋';
  }
}

export const shadowFlower = new ShadowFlowerModule();
