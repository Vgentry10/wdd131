
let selectElem = document.querySelector('select');
let logo = document.querySelector('img');
let pageContent = document.querySelector('#content');
let body = document.querySelector('body');

selectElem.addEventListener('change', changeTheme);

function changeTheme() {
    let current = selectElem.value;
    if (current == 'dark') {
        logo.src = "https://wddbyui.github.io/wdd131/images/byui-logo-white.png";
        body.style.backgroundColor = "#121212";
        pageContent.style.backgroundColor = "#121212";  
        pageContent.style.color = "white";           
    } else {
        logo.src = "https://wddbyui.github.io/wdd131/images/byui-logo-blue.webp";
        body.style.backgroundColor = "whitesmoke";
        pageContent.style.backgroundColor = "white";  
        pageContent.style.color = "black";
    }
}           
                    