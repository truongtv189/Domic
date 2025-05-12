import { _decorator, Component, Label } from 'cc';
import { I18n } from './I18n';
// import i18n from 'db://i18n/LanguageData';

const { ccclass, property } = _decorator;

@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component {
    @property
    langKey: string = '';
    private _label: Label | null = null;
    onLoad() {
        this._label = this.getComponent(Label);
        this.updateLabel();
    }
      public updateLabel() {
    if (this._label && this.langKey) {
      this._label.string = I18n.t(this.langKey);
    }
  }
}
