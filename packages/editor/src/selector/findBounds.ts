import { AnswerType, IBounds, IUI } from '@leafer-in/interface'


const { No, Yes, NoAndSkip, YesAndSkip } = AnswerType

export function findBounds(leaf: IUI, bounds: IBounds): AnswerType {
    if (leaf.__.hittable && bounds.hit(leaf.__world)) {

        if (leaf.__.editable) {
            if (leaf.isBranch && !leaf.__.hitChildren) {
                return leaf.__.hitSelf ? YesAndSkip : NoAndSkip
            } else if (leaf.isFrame) {
                return bounds.includes(leaf.__layout.boxBounds, leaf.__world) ? YesAndSkip : No
            } else {
                if (bounds.hit(leaf.__layout.boxBounds, leaf.__world) && leaf.__.hitSelf) return Yes
            }
        }

        return No

    } else {

        return leaf.isBranch ? NoAndSkip : No

    }
}