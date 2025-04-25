import { _decorator, Component, Node, Animation, AnimationClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StaggeredLoopAnimation')
export class StaggeredLoopAnimation extends Component {
    @property([Node])
    targetNodes: Node[] = [];

    @property(AnimationClip)
    sharedClip: AnimationClip = null;

    start() {
        for (const node of this.targetNodes) {
            let anim = node.getComponent(Animation);
            if (!anim) {
                anim = node.addComponent(Animation);
            }

            anim.addClip(this.sharedClip);
            anim.defaultClip = this.sharedClip;

            const state = anim.getState(this.sharedClip.name);

            // Phát animation
            anim.play(this.sharedClip.name);

            // Chờ một frame rồi set thời gian thủ công (vì nếu set trước play, nó bị reset lại)
            setTimeout(() => {
                const duration = this.sharedClip.duration;
                const randomTime = Math.random() * duration;
                state.time = randomTime;
            }, 0);
        }
    }
}
