import { IUIEvent } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'


export function updateCursor(editor: IEditor, e: IUIEvent): void {
    const { editBox } = editor, point = editBox.enterPoint
    if (!point || !editor.hasTarget || !editBox.visible) return

    let { rotation } = editBox, showResizeCursor: boolean
    const { resizeable, rotateable } = editor.config
    const { direction, pointType } = point

    const isResizePoint = showResizeCursor = pointType === 'resize'
    if (isResizePoint && rotateable && (e.metaKey || e.ctrlKey || !resizeable)) showResizeCursor = false

    if (editBox.flippedOne) rotation = -rotation

    point.cursor = { url: toDataURL(showResizeCursor ? getResizeCursor(rotation + (direction + 1) * 45) : getRotateCursor(rotation + (direction + 4) * 45)), x: 15, y: 15 }
}

export function updateMoveCursor(editor: IEditor): void {
    editor.editBox.rect.cursor = editor.config.moveCursor
}


function toDataURL(svg: string): string {
    return '"data:image/svg+xml,' + encodeURIComponent(svg) + '"'
}

function getRotateCursor(rotation: number): string {
    return `
<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_1248_22)" transform="rotate(${rotation},15,15)">
<mask id="path-1-outside-1_1248_22" maskUnits="userSpaceOnUse" x="3" y="3" width="24" height="24" fill="black">
<rect fill="white" x="3" y="3" width="24" height="24"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M20.1549 9.4532L22.0512 4L25.8257 8.36884L23.4346 8.82607C23.8115 13.6077 22.5448 17.4629 19.9412 20.0303C17.3412 22.5942 13.484 23.799 8.82524 23.4368L8.36616 25.8284L4 22.0508L9.45455 20.1584L9.015 22.4482C13.4113 22.7664 16.9163 21.6088 19.2391 19.3183C21.563 17.0267 22.7782 13.5273 22.4461 9.01509L20.1549 9.4532Z"/>
</mask>
<path fill-rule="evenodd" clip-rule="evenodd" d="M20.1549 9.4532L22.0512 4L25.8257 8.36884L23.4346 8.82607C23.8115 13.6077 22.5448 17.4629 19.9412 20.0303C17.3412 22.5942 13.484 23.799 8.82524 23.4368L8.36616 25.8284L4 22.0508L9.45455 20.1584L9.015 22.4482C13.4113 22.7664 16.9163 21.6088 19.2391 19.3183C21.563 17.0267 22.7782 13.5273 22.4461 9.01509L20.1549 9.4532Z" fill="black"/>
<path d="M22.0512 4L22.4296 3.67312L21.8634 3.0178L21.579 3.83578L22.0512 4ZM20.1549 9.4532L19.6827 9.28897L19.3982 10.107L20.2488 9.9443L20.1549 9.4532ZM25.8257 8.36884L25.9196 8.85995L26.7702 8.69729L26.2041 8.04197L25.8257 8.36884ZM23.4346 8.82607L23.3407 8.33497L22.9009 8.41905L22.9361 8.86537L23.4346 8.82607ZM19.9412 20.0303L19.5902 19.6743L19.5902 19.6743L19.9412 20.0303ZM8.82524 23.4368L8.86399 22.9383L8.41845 22.9036L8.3342 23.3425L8.82524 23.4368ZM8.36616 25.8284L8.03901 26.2065L8.69393 26.7731L8.85719 25.9226L8.36616 25.8284ZM4 22.0508L3.83611 21.5784L3.01793 21.8623L3.67285 22.4289L4 22.0508ZM9.45455 20.1584L9.94558 20.2526L10.1088 19.4021L9.29066 19.686L9.45455 20.1584ZM9.015 22.4482L8.52396 22.354L8.41793 22.9063L8.9789 22.9469L9.015 22.4482ZM19.2391 19.3183L19.5902 19.6743L19.5902 19.6743L19.2391 19.3183ZM22.4461 9.01509L22.9448 8.97838L22.9035 8.41855L22.3522 8.52398L22.4461 9.01509ZM21.579 3.83578L19.6827 9.28897L20.6272 9.61742L22.5235 4.16422L21.579 3.83578ZM26.2041 8.04197L22.4296 3.67312L21.6729 4.32688L25.4473 8.69572L26.2041 8.04197ZM23.5285 9.31717L25.9196 8.85995L25.7318 7.87774L23.3407 8.33497L23.5285 9.31717ZM20.2923 20.3863C23.026 17.6906 24.3185 13.6763 23.933 8.78678L22.9361 8.86537C23.3046 13.5392 22.0636 17.2352 19.5902 19.6743L20.2923 20.3863ZM8.78648 23.9353C13.5498 24.3056 17.5637 23.077 20.2923 20.3863L19.5902 19.6743C17.1187 22.1114 13.4181 23.2923 8.86399 22.9383L8.78648 23.9353ZM8.85719 25.9226L9.31627 23.531L8.3342 23.3425L7.87512 25.7341L8.85719 25.9226ZM3.67285 22.4289L8.03901 26.2065L8.6933 25.4502L4.32715 21.6727L3.67285 22.4289ZM9.29066 19.686L3.83611 21.5784L4.16389 22.5232L9.61844 20.6308L9.29066 19.686ZM9.50603 22.5425L9.94558 20.2526L8.96351 20.0641L8.52396 22.354L9.50603 22.5425ZM18.888 18.9623C16.6925 21.1272 13.3426 22.2601 9.05109 21.9495L8.9789 22.9469C13.4799 23.2727 17.1401 22.0903 19.5902 19.6743L18.888 18.9623ZM21.9475 9.05179C22.2716 13.4559 21.0831 16.7977 18.888 18.9623L19.5902 19.6743C22.0429 17.2557 23.2848 13.5987 22.9448 8.97838L21.9475 9.05179ZM20.2488 9.9443L22.54 9.50619L22.3522 8.52398L20.061 8.9621L20.2488 9.9443Z" fill="white" mask="url(#path-1-outside-1_1248_22)"/>
</g>
<defs>
<filter id="filter0_d_1248_22" x="1.01782" y="1.01782" width="29.7524" height="29.7554" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="1" dy="1"/>
<feGaussianBlur stdDeviation="1.5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1248_22"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1248_22" result="shape"/>
</filter>
</defs>
</svg>
`
}

function getResizeCursor(rotation: number): string {
    return `
<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_1248_23)" transform="rotate(${rotation},15,15)">
<mask id="path-1-outside-1_1248_23" maskUnits="userSpaceOnUse" x="2" y="11" width="26" height="8" fill="black">
<rect fill="white" x="2" y="11" width="26" height="8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 17.7735L3 14.8868L8 12V14.3868H22V12L27 14.8868L22 17.7735V15.3868H8V17.7735Z"/>
</mask>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 17.7735L3 14.8868L8 12V14.3868H22V12L27 14.8868L22 17.7735V15.3868H8V17.7735Z" fill="black"/>
<path d="M3 14.8868L2.75 14.4537L2 14.8868L2.75 15.3198L3 14.8868ZM8 17.7735L7.75 18.2065L8.5 18.6395V17.7735H8ZM8 12H8.5V11.134L7.75 11.567L8 12ZM8 14.3868H7.5V14.8868H8V14.3868ZM22 14.3868V14.8868H22.5V14.3868H22ZM22 12L22.25 11.567L21.5 11.134V12H22ZM27 14.8868L27.25 15.3198L28 14.8868L27.25 14.4537L27 14.8868ZM22 17.7735H21.5V18.6395L22.25 18.2065L22 17.7735ZM22 15.3868H22.5V14.8868H22V15.3868ZM8 15.3868V14.8868H7.5V15.3868H8ZM2.75 15.3198L7.75 18.2065L8.25 17.3405L3.25 14.4537L2.75 15.3198ZM7.75 11.567L2.75 14.4537L3.25 15.3198L8.25 12.433L7.75 11.567ZM8.5 14.3868V12H7.5V14.3868H8.5ZM22 13.8868H8V14.8868H22V13.8868ZM21.5 12V14.3868H22.5V12H21.5ZM27.25 14.4537L22.25 11.567L21.75 12.433L26.75 15.3198L27.25 14.4537ZM22.25 18.2065L27.25 15.3198L26.75 14.4537L21.75 17.3405L22.25 18.2065ZM21.5 15.3868V17.7735H22.5V15.3868H21.5ZM8 15.8868H22V14.8868H8V15.8868ZM8.5 17.7735V15.3868H7.5V17.7735H8.5Z" fill="white" mask="url(#path-1-outside-1_1248_23)"/>
</g>
<defs>
<filter id="filter0_d_1248_23" x="0" y="9.13403" width="32" height="13.5056" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="1" dy="1"/>
<feGaussianBlur stdDeviation="1.5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1248_23"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1248_23" result="shape"/>
</filter>
</defs>
</svg>
`
}