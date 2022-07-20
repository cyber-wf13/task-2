import Popup from "./popup";

window.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
  const imgBlock = document.querySelector(".img-block");
  countImages();
  setDate();
  imgBlock.addEventListener("click", handleImageClick);
}

function countImages() {
  const displayCounter = document.querySelector("[data-count]");
  const imageItems = document.querySelectorAll(".img");
  displayCounter.textContent = imageItems.length;
}

function setDate() {
  const displayDate = document.querySelector("[data-time]");

  function getCurrentTime() {
    const date = new Date();
    displayDate.textContent = `${date.toLocaleDateString()} ${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, 0)}`;
  }

  getCurrentTime();

  setInterval(getCurrentTime, 1000);
}

function handleImageClick(e) {
  const { target } = e;

  if (target.closest(".img")) {
    const imageCopy = target.closest(".img").cloneNode();
    imageCopy.classList.add("img--no-transform");

    const popup = new Popup(imageCopy);
    popup.addPopup();
  }
}
