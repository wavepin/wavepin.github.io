window.addEventListener("load", function () {
  var yesButton = document.getElementById("yesButton");
  var noButton = document.getElementById("noButton");
  noButton.style.position = "absolute";
  // Center horizontally below yes button:
  noButton.style.left =
    yesButton.offsetLeft +
    (yesButton.offsetWidth - noButton.offsetWidth) / 2 +
    "px";
  // Place noButton 10px below the yesButton:
  noButton.style.top = yesButton.offsetTop + yesButton.offsetHeight + 10 + "px";
});

document.getElementById("yesButton").addEventListener("click", function () {
  document.getElementById("yesGif").style.display = "block";
  document.getElementById("askGif").style.display = "none";
  document.getElementById("yesButton").style.display = "none";
  document.getElementById("noButton").style.display = "none";
  document.getElementById("question").innerText =
    "Yayyyy! I knew you would say yes! 🥰";
});

var noButton = document.getElementById("noButton");
noButton.addEventListener("mousemove", function (e) {
  var distance = Math.sqrt(
    Math.pow(e.clientX - noButton.offsetLeft, 2) +
      Math.pow(e.clientY - noButton.offsetTop, 2)
  );
  if (distance < 500) {
    noButton.style.position = "absolute";
    noButton.style.left =
      Math.random() * (window.innerWidth - noButton.offsetWidth) + "px";
    noButton.style.top =
      Math.random() * (window.innerHeight - noButton.offsetHeight) + "px";
  }
});