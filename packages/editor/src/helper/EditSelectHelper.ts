import { IBounds, ILeafList, IUI } from '@leafer-ui/interface'
import { Answer } from '@leafer-ui/core'

const { No, Yes, NoAndSkip, YesAndSkip } = Answer

export const EditSelectHelper = {

    findOne(path: ILeafList): IUI {
        return path.list.find((leaf) => leaf.editable) as IUI
    },

    findBounds(leaf: IUI, bounds: IBounds): Answer {
        if (leaf.__.hittable && leaf.__.visible && !leaf.__.locked && bounds.hit(leaf.__world)) {

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

}