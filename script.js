document.getElementById('yesButton').addEventListener('click', function() {
    document.getElementById('yesGif').style.display = 'block';
    document.getElementById('askGif').style.display = 'none';
    document.getElementById('yesButton').style.display = 'none';
    document.getElementById('noButton').style.display = 'none';
    document.getElementById('question').innerText = 'Zãyyyyy';
});

var noButton = document.getElementById('noButton');
noButton.addEventListener('mousemove', function(e) {
    var distance = Math.sqrt(Math.pow(e.clientX - noButton.offsetLeft, 2) + Math.pow(e.clientY - noButton.offsetTop, 2));
    if (distance < 500) { // Change this value to increase or decrease the "run away" distance
        noButton.style.position = 'absolute';
        noButton.style.left = Math.random() * (window.innerWidth - noButton.offsetWidth) + 'px';
        noButton.style.top = Math.random() * (window.innerHeight - noButton.offsetHeight) + 'px';
    }
});