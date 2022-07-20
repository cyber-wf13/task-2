import Popup from "./popup";

window.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
  const imgBlock = document.querySelector(".img-block");
  const resetButton = document.querySelector(".content__button-reset");
  setDate();
  setImagesId();
  removeSavedImages(imgBlock);
  countImages();
  imgBlock.addEventListener("click", handleImageClick);
  resetButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.reload();
  });
}

function countImages() {
  const displayCounter = document.querySelector("[data-count]");
  const imageItems = document.querySelectorAll(".img-block__wrapper");
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

function setImagesId() {
  const images = document.querySelectorAll(".img-block__wrapper");
  images.forEach((image, idx) => {
    image.setAttribute("data-id", `image-${idx}`);
  });
}

function handleImageClick(e) {
  const { target } = e;

  // Відслідковує клік на картинці для створення popup
  if (target.closest(".img")) {
    const imageCopy = target.closest(".img").cloneNode();
    imageCopy.classList.add("img--no-transform");

    const popup = new Popup(imageCopy);
    popup.addPopup();
  } else if (target.closest(".img-block__button-delete")) {
    // Відслідковує клік на кнопці видалення картинки
    const parent = target.parentElement;
    handleDeleteButtonClick(parent);
  }
}

function handleDeleteButtonClick(image) {
  const parentImages = image.parentElement;
  const imageId = image.getAttribute("data-id");
  parentImages.removeChild(image);
  addToLocalStorage(imageId);
}

function addToLocalStorage(id) {
  // Отримуємо дані з localStorage та додаємо новий id
  const allId = getFromLocalStorage();
  allId.push(id);

  // Перезаписуємо localStorage
  localStorage.setItem("removeImages", JSON.stringify(allId));
}

function getFromLocalStorage() {
  let removedImages = [];
  // Якщо дані в localStorage є, то отримуємо їх та доповноюємо масив
  if (localStorage.getItem("removeImages")) {
    removedImages = [...JSON.parse(localStorage.getItem("removeImages"))];
  }
  return removedImages;
}

function removeSavedImages(parent) {
  const removedImages = getFromLocalStorage();
  // Якщо є збережена інформація з localStorage про видалені елементи, знаходимо їх та видаляємо
  if (removedImages) {
    removedImages.forEach((imageId) => {
      parent.removeChild(document.querySelector(`[data-id='${imageId}']`));
    });
  }
}
