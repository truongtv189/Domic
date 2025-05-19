import { _decorator, Component, Node, UITransform, log, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ParentChildResponsive')
export class ParentChildResponsive extends Component {
    @property(Node)
    parentNode: Node = null;

    @property([Node])
    childNodes: Node[] = [];

    private initialScaleX: number = 1;
    private initialChildPositions: Vec3[] = [];
    private baseWidth: number = 720;

    onLoad() {
        if (!this.parentNode || this.childNodes.length === 0) {
            return;
        }
        this.initialScaleX = this.parentNode.scale.x;
        this.childNodes.forEach(node => {
            this.initialChildPositions.push(node.position.clone());
        });
        this.updateParentScaleX();
        view.on('canvas-resize', this.onResized, this);
    }

    onResized() {
        this.updateParentScaleX();
    }

    updateParentScaleX() {
        const visibleSize = view.getVisibleSize();
        const currentWidth = visibleSize.width;

        if (currentWidth >= this.baseWidth) {
            this.parentNode.setScale(this.initialScaleX, this.initialScaleX, 1);
            this.resetChildPositions();
            return;
        }

        const scaleFactorX = currentWidth / this.baseWidth;
        this.parentNode.setScale(scaleFactorX, scaleFactorX, 1);

        this.childNodes.forEach((node, index) => {
            const pos = this.initialChildPositions[index].clone();
            pos.x *= scaleFactorX;
            node.setPosition(pos);
        });
    }

    resetChildPositions() {
        this.childNodes.forEach((node, index) => {
            node.setPosition(this.initialChildPositions[index]);
        });
    }

    onDestroy() {
        view.off('canvas-resize', this.onResized, this);
    }
}
