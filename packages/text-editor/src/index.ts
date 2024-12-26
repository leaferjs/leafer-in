export { TextEditor } from './TextEditor'

import { Plugin } from '@leafer-ui/core'

Plugin.add('text-editor')
setTimeout(() => Plugin.check('editor', true))