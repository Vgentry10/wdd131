const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('nav');

btn.addEventListener('click', toggleMenu);

function toggleMenu() {
    nav.classList.toggle('hide');
    btn.classList.toggle('change');
    
}
  