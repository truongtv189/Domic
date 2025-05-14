import { _decorator, Component, instantiate, Node, Prefab, resources, director } from 'cc';
import { AudioManager } from './AudioManager';
import { LoadingManager } from './LoadingManager';
const { ccclass, property } = _decorator;

@ccclass('GameInit')
export class GameInit extends Component {
    @property(Node)
    private Loading: Node | null = null;

    @property(Prefab)
    LoadingPrefabs: Prefab = null;

    start() {
        const loadingNode = instantiate(this.LoadingPrefabs);
        this.Loading.addChild(loadingNode);
        loadingNode.setPosition(0, 0, 0);
        this.Loading.active = true;

        // this.loadPrefabs().then(() => {
            const loadingCtrl = loadingNode.getComponent('LoadingCtrl');
            if (loadingCtrl) {
                LoadingManager.loadSceneWithLoading('Home');
            }
        // });
    }

    // loadPrefabs(): Promise<void> {
    //     return new Promise((resolve) => {
    //         resources.load("prefabs/AudioManagerNode", Prefab, (err, prefab) => {
    //             if (err || !prefab) {
    //                 console.error("Failed to load AudioManagerNode prefab", err);
    //                 resolve();
    //                 return;
    //             }
    //             const audioNode = instantiate(prefab);
    //             director.getScene().addChild(audioNode);
    //             resolve();
    //         });
    //     });
    // }
}
