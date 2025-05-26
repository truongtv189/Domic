import { _decorator, Component, director, instantiate, Node, Prefab, resources } from 'cc';
import { LoadingState } from './LoadingState';
const { ccclass, property } = _decorator;

@ccclass('LoadingManager')
export class LoadingManager extends Component {
    private static loadingNode: Node | null = null;
    private static loadingState: LoadingState = null;

    static showLoading() {
        if (!this.loadingNode) {
            const loadingPrefab = resources.get("PersistentRoot", Prefab);
            if (loadingPrefab) {
                this.loadingNode = instantiate(loadingPrefab);
                director.getScene().addChild(this.loadingNode);
            }
        }
        if (this.loadingNode) {
            this.loadingNode.active = true;
        }
    }

    static hideLoading() {
        if (this.loadingNode) {
            this.loadingNode.active = false;
        }
    }

    static loadSceneWithLoading(sceneName: string, shouldResetProgress: boolean = false) {
        if (shouldResetProgress) {
            LoadingState.getInstance().resetProgress();
        }
        this.showLoading();
        director.loadScene(sceneName, () => {
            this.hideLoading();
        });
    }
}


