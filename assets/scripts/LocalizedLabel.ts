import { _decorator, Component, Label } from 'cc';
// import i18n from 'db://i18n/LanguageData';

const { ccclass, property } = _decorator;

@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component {
    @property({ tooltip: "Khóa ngôn ngữ, ví dụ: 'start_game'" })
    langKey = '';

    updateLabel() {
        const label = this.getComponent(Label);
        if (label && this.langKey) {
            // label.string = i18n.t(this.langKey);
        }
    }

    start() {
        this.updateLabel();
    }
}
