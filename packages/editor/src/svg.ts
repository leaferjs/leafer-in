const filterStyle = `
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in="SourceGraphic" result="shape"/>`


export const resizeSVG = `
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#f)">
<g transform="rotate({{rotation}},12,12)">
<path d="M7.5 8.0H8.5V5.9L6.8 7.2L7.5 8.0ZM3 11.4L2.3 10.6L1.3 11.4L2.3 12.2L3 11.4ZM7.5 10.4H6.5V11.4H7.5V10.4ZM16.5 10.4V11.4H17.5V10.4H16.5ZM16.5 8.0L17.1 7.2L15.5 5.9V8.0H16.5ZM21 11.4L21.6 12.2L22.6 11.4L21.6 10.6L21 11.4ZM16.5 14.9H15.5V16.9L17.1 15.7L16.5 14.9ZM16.5 12.4H17.5V11.4H16.5V12.4ZM7.5 12.4V11.4H6.5V12.4H7.5ZM7.5 14.9L6.8 15.7L8.5 16.9V14.9H7.5ZM6.8 7.2L2.3 10.6L3.6 12.2L8.1 8.7L6.8 7.2ZM8.5 10.4V8.0H6.5V10.4H8.5ZM16.5 9.4H7.5V11.4H16.5V9.4ZM17.5 10.4V8.0H15.5V10.4H17.5ZM15.8 8.7L20.3 12.2L21.6 10.6L17.1 7.2L15.8 8.7ZM20.3 10.6L15.8 14.1L17.1 15.7L21.6 12.2L20.3 10.6ZM17.5 14.9V12.4H15.5V14.9H17.5ZM7.5 13.4H16.5V11.4H7.5V13.4ZM8.5 14.9V12.4H6.5V14.9H8.5ZM2.3 12.2L6.8 15.7L8.1 14.1L3.6 10.6L2.3 12.2Z" fill="white"/>
<path fill-rule="evenodd" d="M3 11.4L7.5 8.0V10.4H16.5V8.0L21 11.4L16.5 14.9V12.4H7.5V14.9L3 11.4Z" fill="black"/>
</g>
</g>
<defs>
<filter id="f" x="-1.6" y="3.9" width="27.2" height="16.9" filterUnits="userSpaceOnUse">
${filterStyle}
</filter>
</defs>
</svg>
`

export const rotateSVG = `
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#f)">
<g transform="rotate(135,12,12),rotate({{rotation}},12,12)">
<path d="M20.4 8H21.4L20.8 7.1L17.3 2.6L17 2.1L16.6 2.6L13.1 7.1L12.5 8H13.5H15.4C14.9 11.8 11.8 14.9 8 15.4V13.5V12.5L7.1 13.1L2.6 16.6L2.1 17L2.6 17.3L7.1 20.8L8 21.4V20.4V18.4C13.5 17.9 17.9 13.5 18.4 8H20.4Z" stroke="white"/>
<path fill-rule="evenodd" d="M17 3L20.4 7.5H17.9C17.7 13.1 13.1 17.7 7.5 17.9V20.4L3 17L7.5 13.5V15.9C12.0 15.7 15.7 12.0 15.9 7.5H13.5L17 3Z" fill="black"/>
</g>
</g>
<defs>
<filter id="f" x="-1.6" y="-0.6" width="27.1" height="27.1" filterUnits="userSpaceOnUse">
${filterStyle}
</filter>
</defs>
</svg>
`

export const skewSVG = `
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#f)">
<g transform="rotate(90,12,12),rotate({{rotation}},12,12)">
<path d="M21 10.4L21 11.4L23.8 11.4L21.6 9.6L21 10.4ZM17 10.4V11.4L17 11.4L17 10.4ZM15.5 6L16.1 5.2L14.5 3.9V6H15.5ZM15.5 8.4V9.4H16.5V8.4H15.5ZM6 8.4V7.4H5V8.4H6ZM6 10.4H5V11.4H6V10.4ZM7 14.4V13.4L7 13.4L7 14.4ZM3 14.4L3 13.4L0.1 13.4L2.3 15.2L3 14.4ZM8.5 18.9L7.8 19.7L9.5 21.0V18.9H8.5ZM8.5 16.4V15.4H7.5V16.4H8.5ZM19 16.4V17.4H20V16.4H19ZM19 14.4H20V13.4H19V14.4ZM21 9.4L17 9.4L17 11.4L21 11.4L21 9.4ZM14.8 6.7L20.3 11.2L21.6 9.6L16.1 5.2L14.8 6.7ZM16.5 8.4V6H14.5V8.4H16.5ZM6 9.4H15.5V7.4H6V9.4ZM7 10.4V8.4H5V10.4H7ZM15.5 9.4H6V11.4H15.5V9.4ZM17 9.4H15.5V11.4H17V9.4ZM7 15.4H8.5V13.4H7V15.4ZM3 15.4L7 15.4L7 13.4L3 13.4L3 15.4ZM9.1 18.1L3.6 13.6L2.3 15.2L7.8 19.7L9.1 18.1ZM7.5 16.4V18.9H9.5V16.4H7.5ZM19 15.4H8.5V17.4H19V15.4ZM18 14.4V16.4H20V14.4H18ZM8.5 15.4H19V13.4H8.5V15.4Z" fill="white"/>
<path fill-rule="evenodd" d="M17 10.4L21 10.4L15.5 6V8.4H6V10.4H15.5H17ZM8.5 14.4H7L3 14.4L8.5 18.9V16.4H19V14.4H8.5Z" fill="black"/>
</g>
</g>
<defs>
<filter x="-2.8" y="1.9" width="29.6" height="23.1" filterUnits="userSpaceOnUse" >
${filterStyle}
</filter>
</defs>
</svg>
`