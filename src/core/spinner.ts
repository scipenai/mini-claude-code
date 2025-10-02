// Spinner class for visual feedback
export class Spinner {
    private label: string;
    private frames: string[];
    private stopFlag: boolean = false;
    private frameIndex: number = 0;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(label: string = "Waiting for model response") {
        this.label = label;
        this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    }

    start(): void {
        if (!process.stdout.isTTY || this.intervalId) {
            return;
        }

        this.stopFlag = false;
        this.intervalId = setInterval(() => {
            if (this.stopFlag) {
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                return;
            }

            process.stdout.write(`\r${this.label} ${this.frames[this.frameIndex % this.frames.length]}`);
            this.frameIndex++;
        }, 80);
    }

    stop(): void {
        this.stopFlag = true;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        try {
            // clear current line
            process.stdout.write("\r\x1b[2K");
        } catch (e) {
            // ignore
        }
    }
}