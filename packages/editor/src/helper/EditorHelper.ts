import { IGroup, ILeaf, IUI } from '@leafer-ui/interface'
import { Group, Matrix } from '@leafer-ui/core'


const order = (a: ILeaf, b: ILeaf) => a.parent.children.indexOf(a) - b.parent.children.indexOf(b)
const reverseOrder = (a: ILeaf, b: ILeaf) => b.parent.children.indexOf(b) - a.parent.children.indexOf(a)

export const EditorHelper = {

    group(list: IUI[], element?: IUI, group?: IGroup): IGroup {
        list.sort(reverseOrder)
        const { app, parent } = list[0]
        if (!group) group = new Group()
        parent.addAt(group, parent.children.indexOf(list[0]))
        list.sort(order)

        const matrx = new Matrix(element.worldTransform)
        matrx.divideParent(parent.worldTransform)
        group.setTransform(matrx)
        group.editable = true
        group.hitChildren = false

        app.lockLayout()
        list.forEach(child => group.drop(child))
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
                    parent.drop(children[0], parent.children.indexOf(leaf))
                }
                leaf.remove()
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
            let zIndex
            const { parent } = leaf
            if (parent) {
                const { children } = parent
                const top = children.length - 1
                const zIndexOfTop = children[top].__.zIndex
                const current = children.indexOf(leaf)
                if (current !== top) {
                    children.splice(current, 1)
                    children.push(leaf)
                    zIndex = zIndexOfTop + 1
                } else {
                    zIndex = zIndexOfTop
                }
                leaf.zIndex = zIndex
            }
        })
    },

    toBottom(list: IUI[]): void {
        list.sort(reverseOrder)
        list.forEach(leaf => {
            let zIndex
            const { parent } = leaf
            if (parent) {
                const { children } = parent
                const zIndexOfBottom = children[0].__.zIndex
                const current = children.indexOf(leaf)
                if (current !== 0) {
                    children.splice(current, 1)
                    children.unshift(leaf)
                    zIndex = zIndexOfBottom - 1
                } else {
                    zIndex = zIndexOfBottom
                }
                leaf.zIndex = zIndex
            }
        })
    }

}