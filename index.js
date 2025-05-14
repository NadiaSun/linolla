const btn = document.getElementById('btn-panel')
const mask = document.getElementById('mask-panel')
const content = document.getElementById('menu-panel')
const close = document.getElementById('close-panel')
btn.addEventListener('click', () => {
    mask.style.display = 'block'
    content.style.display = 'block'
})
mask.addEventListener('click', () => {
    mask.style.display = 'none'
    content.style.display = 'none'
})

close.addEventListener('click', () => {
    mask.style.display = 'none'
    content.style.display = 'none'
})

for (let e of content.getElementsByTagName('a')) {
    e.addEventListener('click', () => {
        mask.style.display = 'none'
        content.style.display = 'none'
    })
}


const popup = document.getElementById('popup-message')
const btns = document.querySelectorAll('.btn-popup')
const closePopup = document.getElementById('btn-close')
const closeBlock = document.getElementById('block-close')
for(let btn of btns) {
	btn.addEventListener('click', ()=> {
		popup.style.display='block'
		closeBlock.style.display = 'block'
	})
}
closePopup.addEventListener('click', ()=> {
	popup.style.display='none'
	closeBlock.style.display = 'none'
})
closeBlock.addEventListener('click', ()=> {
	popup.style.display='none'
	closeBlock.style.display = 'none'
})