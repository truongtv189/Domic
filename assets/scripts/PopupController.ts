import { _decorator, Component, Node } from 'cc';
import { PopupItem } from './PopupItem';
const { ccclass, property } = _decorator;

@ccclass('PopupController')
export class PopupController extends Component {
    static _instance: PopupController = null;

    static get instance() {
        if (!PopupController._instance) {
            PopupController._instance = new PopupController();
        }
        return PopupController._instance;
    }

    @property({ type: PopupItem })
    videoLoading: PopupItem = null;

    protected onLoad(): void {
        PopupController._instance = this;
    }
}


