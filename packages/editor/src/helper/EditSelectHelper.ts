import { IBounds, ILeafList, IUI, IUIData } from '@leafer-ui/interface'


export const EditSelectHelper = {

    findOne(path: ILeafList): IUI {
        return path.list.find((leaf) => leaf.editable) as IUI
    },

    findByBounds(branch: IUI, bounds: IBounds): IUI[] {
        const list: IUI[] = []
        eachFind([branch], list, bounds)
        return list
    }

}


function eachFind(children: IUI[], list: IUI[], bounds: IBounds): void {
    let child: IUI, data: IUIData
    for (let i = 0, len = children.length; i < len; i++) {
        child = children[i], data = child.__
        if (data.hittable && data.visible && !data.locked && bounds.hit(child.__world)) {

            if (data.editable) {
                if (child.isBranch && !data.hitChildren) {
                    if (data.hitSelf) list.push(child)
                    continue
                } else if (child.isFrame) {
                    if (bounds.includes(child.__layout.boxBounds, child.__world)) {
                        list.push(child)
                        continue
                    }
                } else if (bounds.hit(child.__layout.boxBounds, child.__world) && data.hitSelf) list.push(child)
            }

            if (child.isBranch) eachFind(child.children, list, bounds)

        }
    }
}