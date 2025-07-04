import { ILeaf, ILeafMap, IEventListenerId, IFindMethod, IAnswer, IFindCondition, IBooleanMap, IFinder } from '@leafer-ui/interface'
import { ChildEvent, DataHelper, Answer, PropertyEvent, LeafHelper, isArray, isUndefined } from '@leafer-ui/draw'


const { Yes, NoAndSkip, YesAndSkip } = Answer
const idCondition = {} as IFindCondition, classNameCondition = {} as IFindCondition, tagCondition = {} as IFindCondition

export class Finder implements IFinder {

    public target?: ILeaf // target 不存在时，为临时选择器（不能缓存数据）

    protected innerIdMap: ILeafMap = {}
    protected idMap: ILeafMap = {}

    protected findLeaf: ILeaf

    protected methods = {
        id: (leaf: ILeaf, name: string) => leaf.id === name ? (this.target && (this.idMap[name] = leaf), 1) : 0,
        innerId: (leaf: ILeaf, innerId: number) => leaf.innerId === innerId ? (this.target && (this.innerIdMap[innerId] = leaf), 1) : 0,
        className: (leaf: ILeaf, name: string) => leaf.className === name ? 1 : 0,
        tag: (leaf: ILeaf, name: string) => leaf.__tag === name ? 1 : 0,
        tags: (leaf: ILeaf, nameMap: IBooleanMap) => nameMap[leaf.__tag] ? 1 : 0
    }

    protected __eventIds: IEventListenerId[]


    constructor(target: ILeaf) {
        if (this.target = target) this.__listenEvents()
    }

    public getBy(condition: number | string | IFindCondition | IFindMethod, branch?: ILeaf, one?: boolean, options?: any): ILeaf | ILeaf[] {
        switch (typeof condition) {
            case 'number':
                const leaf = this.getByInnerId(condition, branch)
                return one ? leaf : (leaf ? [leaf] : [])
            case 'string':
                switch (condition[0]) {
                    case '#':
                        idCondition.id = condition.substring(1), condition = idCondition; break
                    case '.':
                        classNameCondition.className = condition.substring(1), condition = classNameCondition; break
                    default:
                        tagCondition.tag = condition, condition = tagCondition
                }
            case 'object':
                if (!isUndefined(condition.id)) {
                    const leaf = this.getById(condition.id as string, branch)
                    return one ? leaf : (leaf ? [leaf] : [])
                } else if (condition.tag) {
                    const { tag } = condition, isArr = isArray(tag)
                    return this.getByMethod(isArr ? this.methods.tags : this.methods.tag, branch, one, isArr ? DataHelper.toMap(tag) : tag)
                } else {
                    return this.getByMethod(this.methods.className, branch, one, condition.className)
                }
            case 'function':
                return this.getByMethod(condition as IFindMethod, branch, one, options)
        }
    }


    public getByInnerId(innerId: number, branch?: ILeaf): ILeaf {
        const cache = this.innerIdMap[innerId]
        if (cache) return cache
        this.eachFind(this.toChildren(branch), this.methods.innerId, null, innerId)
        return this.findLeaf
    }

    public getById(id: string, branch?: ILeaf): ILeaf {
        const cache = this.idMap[id]
        if (cache && LeafHelper.hasParent(cache, branch || this.target)) return cache
        this.eachFind(this.toChildren(branch), this.methods.id, null, id)
        return this.findLeaf
    }

    public getByClassName(className: string, branch?: ILeaf): ILeaf[] {
        return this.getByMethod(this.methods.className, branch, false, className) as ILeaf[]
    }

    public getByTag(tag: string, branch?: ILeaf): ILeaf[] {
        return this.getByMethod(this.methods.tag, branch, false, tag) as ILeaf[]
    }

    public getByMethod(method: IFindMethod, branch?: ILeaf, one?: boolean, options?: any): ILeaf[] | ILeaf {
        const list: ILeaf[] = one ? null : []
        this.eachFind(this.toChildren(branch), method, list, options)
        return list || this.findLeaf
    }


    protected eachFind(children: ILeaf[], method: IFindMethod, list?: ILeaf[], options?: any): void {
        let child: ILeaf, result: IAnswer
        for (let i = 0, len = children.length; i < len; i++) {
            child = children[i]
            result = method(child, options)
            if (result === Yes || result === YesAndSkip) {
                if (list) {
                    list.push(child)
                } else {
                    this.findLeaf = child
                    return
                }
            }
            if (child.isBranch && result < NoAndSkip) this.eachFind(child.children, method, list, options)
        }
    }

    protected toChildren(branch: ILeaf): ILeaf[] {
        this.findLeaf = null
        return [branch || this.target]
    }


    protected __onRemoveChild(event: ChildEvent): void {
        const { id, innerId } = event.child
        if (this.idMap[id]) delete this.idMap[id]
        if (this.innerIdMap[innerId]) delete this.innerIdMap[innerId]
    }

    protected __checkIdChange(event: PropertyEvent): void {
        if (event.attrName === 'id') {
            const id = event.oldValue as string
            if (this.idMap[id]) delete this.idMap[id]
        }
    }


    protected __listenEvents(): void {
        this.__eventIds = [
            this.target.on_(ChildEvent.REMOVE, this.__onRemoveChild, this),
            this.target.on_(PropertyEvent.CHANGE, this.__checkIdChange, this)
        ]
    }

    protected __removeListenEvents(): void {
        this.target.off_(this.__eventIds)
        this.__eventIds.length = 0
    }

    public destroy(): void {
        const { __eventIds } = this
        if (__eventIds && __eventIds.length) {
            this.__removeListenEvents()
            this.innerIdMap = {}
            this.idMap = {}
        }
        this.findLeaf = null
    }

}