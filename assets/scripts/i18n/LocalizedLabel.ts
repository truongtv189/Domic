import { _decorator, Component, Label } from 'cc';
import { I18nService } from './I18nService';

const { ccclass, property } = _decorator;

@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component {
    @property
    private textKey: string = '';

    private label: Label | null = null;

    start() {
        this.label = this.getComponent(Label);
        this.updateText();
        
        // Listen for language changes (you can implement an event system)
        // For now, we'll just update on start
    }

    private updateText() {
        if (this.label && this.textKey) {
            this.label.string = I18nService.getInstance().t(this.textKey);
        }
    }

    // Call this method when language changes
    public onLanguageChanged() {
        this.updateText();
    }
} 