export { TextEditor } from './TextEditor'

import { Plugin, Text, surfaceType } from '@leafer-ui/core'


Plugin.add('text-editor', 'editor')

Text.addAttr('textEditing', false, surfaceType)