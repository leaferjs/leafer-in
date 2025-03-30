import { IGroup, IGroupInputData, ILeaf, IUI } from '@leafer-ui/interface'
import { Group, Matrix } from '@leafer-ui/draw'


const order = (a: ILeaf, b: ILeaf) => a.parent.children.indexOf(a) - b.parent.children.indexOf(b)
const reverseOrder = (a: ILeaf, b: ILeaf) => b.parent.children.indexOf(b) - a.parent.children.indexOf(a)

export const EditorHelper = {

    group(list: IUI[], element?: IUI, userGroup?: IGroup | IGroupInputData): IGroup {
        list.sort(reverseOrder)
        const { app, parent } = list[0]

        let group: IGroup
        if (userGroup && (userGroup as IGroup).add) {
            group = userGroup as IGroup
        } else {
            group = new Group(userGroup)
        }

        parent.addAt(group, parent.children.indexOf(list[0]))
        list.sort(order)

        const matrx = new Matrix(element.worldTransform)
        matrx.divideParent(parent.worldTransform)
        group.setTransform(matrx)
        group.editable = true
        group.hitChildren = false

        app.lockLayout()
        list.forEach(child => child.dropTo(group))
        app.unlockLayout()

        return group
    },

    ungroup(list: IUI[]): IUI[] {
        const { app } = list[0]
        const ungroupList: IUI[] = []

        app.lockLayout()
        list.forEach(leaf => {
            if (leaf.isBranch) {
                const { parent, children } = leaf
                while (children.length) {
                    ungroupList.push(children[0])
                    children[0].dropTo(parent, parent.children.indexOf(leaf))
                }
                if (leaf.isBranchLeaf) ungroupList.push(leaf)
                else leaf.remove()
            } else {
                ungroupList.push(leaf)
            }
        })
        app.unlockLayout()

        return ungroupList
    },

    toTop(list: IUI[]): void {
        list.sort(order)
        list.forEach(leaf => {
            if (leaf.parent) leaf.parent.add(leaf)
        })
    },

    toBottom(list: IUI[]): void {
        list.sort(reverseOrder)
        list.forEach(leaf => {
            if (leaf.parent) leaf.parent.addAt(leaf, 0)
        })
    }

}