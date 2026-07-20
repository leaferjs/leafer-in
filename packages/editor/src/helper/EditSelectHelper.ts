import { IBounds, ILeafList, IUI, IUIData } from '@leafer-ui/interface'


export const EditSelectHelper = {

    findOne(path: ILeafList): IUI {
        return path.list.find((leaf) => leaf.editable) as IUI
    },

    findByBounds(branch: IUI, bounds: IBounds, mode: 'hit' | 'includes' = 'hit'): IUI[] {
        const list: IUI[] = []
        eachFind([branch], list, bounds, mode)
        return list
    }

}


function eachFind(children: IUI[], list: IUI[], bounds: IBounds, mode: 'hit' | 'includes'): void {
    let child: IUI, data: IUIData, isFind: boolean
    for (let i = 0, len = children.length; i < len; i++) {
        child = children[i], data = child.__
        if (data.hittable && data.visible && !data.locked && bounds.hit(child.__world)) {

            if (data.editable && data.editable !== 'single') {
                if (child.isFrame) {
                    if (bounds.includes(child.__layout.boxBounds, child.__world)) {
                        list.push(child)
                        continue
                    }
                } else {

                    isFind = bounds[mode](child.__layout.boxBounds, child.__world) && data.hitSelf

                    if (child.isBranch) {
                        if (!data.hitChildren) {
                            if (isFind) list.push(child)
                            continue
                        }
                    } else if (isFind) list.push(child)
                }
            }

            if (child.isBranch) eachFind(child.children, list, bounds, mode)

        }
    }
}