export default class Popup {
  constructor(popupContent = "Content") {
    this.popup = this.createPopup(popupContent);
  }

  createPopup(popupContent = "Content") {
    const popupWrapper = document.createElement("div");
    const popupBody = document.createElement("div");
    const popupCloseButton = document.createElement("button");

    popupWrapper.classList.add("popup-wrapper");
    popupBody.classList.add("popup");
    popupCloseButton.classList.add("popup__button-close", "button");
    popupCloseButton.addEventListener("click", this.removePopup.bind(this));
    popupCloseButton.textContent = "X";

    popupBody.append(popupCloseButton, popupContent);
    popupWrapper.append(popupBody);

    return popupWrapper;
  }

  addPopup() {
    const { body } = document;
    body.append(this.popup);
  }

  removePopup() {
    const { body } = document;
    body.removeChild(this.popup);
  }
}
