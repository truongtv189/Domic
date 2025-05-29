import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
import { GlobalScaleManager } from './GlobalScaleManager';
const { ccclass, property } = _decorator;

@ccclass('ParentChildResponsive')
export class ParentChildResponsive extends Component {
    @property(Node)
    parentNode: Node = null;

    @property([Node])
    childNodes: Node[] = [];

    private initialScaleX: number = 1;
    private initialChildPositions: Vec3[] = [];

    onLoad() {
        if (!this.parentNode || this.childNodes.length === 0) {
            return;
        }
        this.initialScaleX = this.parentNode.scale.x;
        this.childNodes.forEach(node => {
            this.initialChildPositions.push(node.position.clone());
        });

        // Đăng ký sự kiện global scale changed
        if (GlobalScaleManager.instance) {
            GlobalScaleManager.instance.node.on('global-scale-changed', this.onGlobalScaleChanged, this);
        }

        // Scale lần đầu
        this.updateParentScaleX();
    }

    private onGlobalScaleChanged(scale: number) {
        this.updateParentScaleX();
    }

    updateParentScaleX() {
        const globalScale = GlobalScaleManager.instance?.getCurrentScale() || 1;
        
        // Áp dụng scale cho parent node
        this.parentNode.setScale(
            this.initialScaleX * globalScale,
            this.initialScaleX * globalScale,
            1
        );

        // Cập nhật vị trí các node con
        this.childNodes.forEach((node, index) => {
            const pos = this.initialChildPositions[index].clone();
            pos.x *= globalScale;
            node.setPosition(pos);
        });
    }

    onDestroy() {
        if (GlobalScaleManager.instance) {
            GlobalScaleManager.instance.node.off('global-scale-changed', this.onGlobalScaleChanged, this);
        }
    }
}
