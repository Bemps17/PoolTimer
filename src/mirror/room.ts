import type { MirrorSnapshot } from './protocol';

export class EphemeralRoom {
  controllerSecret: string | null = null;
  snapshot: MirrorSnapshot | null = null;
  seq = 0;

  claimController(secret: string): 'ok' | 'busy' {
    if (!secret) return 'busy';
    if (!this.controllerSecret || this.controllerSecret === secret) {
      this.controllerSecret = secret;
      this.seq = 0;
      return 'ok';
    }
    return 'busy';
  }

  acceptSnapshot(seq: number, snapshot: MirrorSnapshot): boolean {
    if (seq < this.seq) return false;
    this.seq = seq;
    this.snapshot = snapshot;
    return true;
  }

  clearController(secret: string): boolean {
    if (this.controllerSecret !== secret) return false;
    this.controllerSecret = null;
    return true;
  }
}
