import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HomeCtrl')
export class HomeCtrl extends Component {
    @property(Prefab) popUpSettingPrefabs: Prefab
    @property(Node) popUpSetting: Node
    onLoad() {
        this.popUpSetting.active = false;
    }
    onShowPopupSetting() {
        const loadingNode = instantiate(this.popUpSettingPrefabs);
        this.popUpSetting.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.popUpSetting.active = true;
        this.popUpSetting.active = true;
    }

}


