import { _decorator } from 'cc';

export class LoadingState {
    private static instance: LoadingState = null;
    private currentProgress: number = 0;

    public static getInstance(): LoadingState {
        if (!this.instance) {
            this.instance = new LoadingState();
        }
        return this.instance;
    }

    public getCurrentProgress(): number {
        return this.currentProgress;
    }

    public setCurrentProgress(progress: number) {
        this.currentProgress = progress;
    }

    public resetProgress() {
        this.currentProgress = 0;
    }
} 